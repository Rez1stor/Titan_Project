using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Infrastructure.Catalog;
using Titan_Project.Server.Infrastructure.Data;
 

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/admin/catalog-beer")]
[Authorize(Roles = Titan_Project.Server.Application.Security.Roles.Admin + "," + Titan_Project.Server.Application.Security.Roles.Moderator)]
public class AdminCatalogBeerController(IConfiguration configuration, IHttpClientFactory httpClientFactory, BeerCatalogProvider beerCatalogProvider, AppDBContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [HttpGet("suggest")]
    public async Task<ActionResult<IReadOnlyList<CatalogBeerSuggestionDto>>> Suggest([FromQuery] string? q = null, [FromQuery] int count = 8)
    {
        var limit = Math.Clamp(count, 1, 20);
        var client = BuildClient();

        List<CatalogBeerApiDto> candidates;
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            var listResponse = await client.GetAsync($"/beer?count={Math.Clamp(limit * 5, 20, 100)}");
            if (!listResponse.IsSuccessStatusCode)
                return StatusCode((int)listResponse.StatusCode, new { message = "Catalog.beer list request failed." });

            var listJson = await listResponse.Content.ReadAsStringAsync();
            var listPayload = JsonSerializer.Deserialize<CatalogBeerListResponse>(listJson, JsonOptions);
            candidates = (listPayload?.Data ?? new List<CatalogBeerApiDto>())
                .Where(item => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name))
                .Take(Math.Clamp(limit * 5, 20, 100))
                .ToList();
        }
        else
        {
            var response = await client.GetAsync($"/beer/search?q={Uri.EscapeDataString(q.Trim())}&count={limit}");
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { message = "Catalog.beer search failed." });

            var json = await response.Content.ReadAsStringAsync();
            var payload = JsonSerializer.Deserialize<CatalogBeerListResponse>(json, JsonOptions);
            candidates = (payload?.Data ?? new List<CatalogBeerApiDto>())
                .Where(item => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name))
                .ToList();
        }

        var scored = new List<(CatalogBeerSuggestionDto Item, int Score)>();
        foreach (var candidate in candidates)
        {
            var detailsResponse = await client.GetAsync($"/beer/{Uri.EscapeDataString(candidate.Id!)}");
            if (!detailsResponse.IsSuccessStatusCode)
                continue;

            var detailsJson = await detailsResponse.Content.ReadAsStringAsync();
            var beer = JsonSerializer.Deserialize<CatalogBeerApiDto>(detailsJson, JsonOptions);
            if (beer is null || string.IsNullOrWhiteSpace(beer.Name))
                continue;

            var score = CountFilledFields(beer);
            scored.Add((new CatalogBeerSuggestionDto(
                beer.Id!,
                beer.Name!,
                beer.Style,
                beer.Abv,
                beer.Ibu,
                beer.Brewer?.Name,
                beer.CbVerified,
                "API",
                score
            ), score));
        }

        return Ok(scored
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Item.Name)
            .Take(limit)
            .Select(item => item.Item)
            .ToList());
    }

    [HttpGet("details/{beerId}")]
    public async Task<ActionResult<CatalogBeerAutofillResponse>> Details(string beerId)
    {
        if (string.IsNullOrWhiteSpace(beerId))
            return BadRequest(new { message = "beerId is required." });

        // Local product shortcut: ids from local suggestions are prefixed with "local:{id}"
        if (beerId.StartsWith("local:", StringComparison.OrdinalIgnoreCase))
        {
            if (!int.TryParse(beerId.Substring(6), out var pid))
                return BadRequest(new { message = "invalid local id." });

            var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == pid);
            if (product is null) return NotFound(new { message = "Local product not found." });

            var payload = new CatalogBeerAutofillProductDto
            {
                Name = product.Name,
                CategoryName = product is Titan_Project.Server.Domain.Model.BeerProduct ? "Beer" : "Alcohol",
                Description = product.Description,
                StrengthAbv = product.Abv > 0 ? (double?)product.Abv : null,
                BeerIbu = product is Titan_Project.Server.Domain.Model.BeerProduct bp ? (decimal?)(bp.Ibu > 0 ? bp.Ibu : (decimal?)null) : null,
                BeerStyle = product is Titan_Project.Server.Domain.Model.BeerProduct bp2 ? bp2.Style.ToString() : null,
                BeerColor = product is Titan_Project.Server.Domain.Model.BeerProduct bp3 ? bp3.Color.ToString() : null,
                Country = string.IsNullOrWhiteSpace(product.CountryOfOrigin) ? null : product.CountryOfOrigin,
                BasePrice = product.Price > 0 ? (decimal?)product.Price : null,
                BeerSrm = product is Titan_Project.Server.Domain.Model.BeerProduct bp4 ? (decimal?)(bp4.Srm > 0 ? bp4.Srm : (decimal?)null) : null,
                ImageUrl = string.IsNullOrWhiteSpace(product.ImageUrl) ? null : product.ImageUrl,
            };

            var missingFields = new List<string>();
            if (string.IsNullOrWhiteSpace(payload.Description)) missingFields.Add("description");
            if (payload.StrengthAbv is null) missingFields.Add("strengthAbv");
            if (payload.BeerIbu is null) missingFields.Add("beerIbu");
            if (string.IsNullOrWhiteSpace(payload.BeerStyle)) missingFields.Add("beerStyle");
            if (string.IsNullOrWhiteSpace(payload.BeerColor)) missingFields.Add("beerColor");
            if (payload.BasePrice is null) missingFields.Add("basePrice");
            if (payload.BeerSrm is null) missingFields.Add("beerSrm");
            if (string.IsNullOrWhiteSpace(payload.Country)) missingFields.Add("country");
            if (string.IsNullOrWhiteSpace(payload.ImageUrl)) missingFields.Add("imageUrl");

            return Ok(new CatalogBeerAutofillResponse(payload, missingFields));
        }

        var client = BuildClient();
        var response = await client.GetAsync($"/beer/{Uri.EscapeDataString(beerId)}");
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { message = "Catalog.beer details request failed." });

        var json = await response.Content.ReadAsStringAsync();
        var beer = JsonSerializer.Deserialize<CatalogBeerApiDto>(json, JsonOptions);
        if (beer is null || string.IsNullOrWhiteSpace(beer.Name))
            return NotFound(new { message = "Beer not found in external catalog." });

        var mappedStyle = MapBeerStyle(beer.Style);
        var mappedColor = InferColorFromStyleText(beer.Style);

        var payloadExt = new CatalogBeerAutofillProductDto
        {
            Name = beer.Name,
            CategoryName = "Beer",
            Description = beer.Description,
            StrengthAbv = beer.Abv,
            BeerIbu = beer.Ibu,
            BeerStyle = mappedStyle,
            BeerColor = mappedColor,
            Country = null,
            BasePrice = null,
            BeerSrm = null,
            ImageUrl = null,
        };

        var missingFieldsExt = new List<string>();
        if (string.IsNullOrWhiteSpace(payloadExt.Description)) missingFieldsExt.Add("description");
        if (payloadExt.StrengthAbv is null) missingFieldsExt.Add("strengthAbv");
        if (payloadExt.BeerIbu is null) missingFieldsExt.Add("beerIbu");
        if (string.IsNullOrWhiteSpace(payloadExt.BeerStyle)) missingFieldsExt.Add("beerStyle");
        if (string.IsNullOrWhiteSpace(payloadExt.BeerColor)) missingFieldsExt.Add("beerColor");
        if (payloadExt.BasePrice is null) missingFieldsExt.Add("basePrice");
        if (payloadExt.BeerSrm is null) missingFieldsExt.Add("beerSrm");
        if (string.IsNullOrWhiteSpace(payloadExt.Country)) missingFieldsExt.Add("country");
        if (string.IsNullOrWhiteSpace(payloadExt.ImageUrl)) missingFieldsExt.Add("imageUrl");

        return Ok(new CatalogBeerAutofillResponse(payloadExt, missingFieldsExt));
    }

    private HttpClient BuildClient()
    {
        var baseUrl = configuration["CatalogBeer:BaseUrl"] ?? "https://api.catalog.beer";
        var apiKey = configuration["CatalogBeer:ApiKey"] ?? "4c7f79a2-ee1a-47c8-a410-d8eb16ce5c88";

        var client = httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/'));
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{apiKey}:"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        client.Timeout = TimeSpan.FromSeconds(12);

        return client;
    }

    private string? MapBeerStyle(string? style)
    {
        if (string.IsNullOrWhiteSpace(style)) return null;

        var normalized = Normalize(style);
        var styles = beerCatalogProvider.GetFamilies().SelectMany(f => f.Styles).Select(s => s.Code).Distinct().ToList();

        var exact = styles.FirstOrDefault(code => Normalize(code) == normalized);
        if (!string.IsNullOrWhiteSpace(exact)) return exact;

        var best = styles
            .Select(code => new
            {
                Code = code,
                Score = ScoreStyleMatch(normalized, Normalize(code)),
            })
            .OrderByDescending(item => item.Score)
            .FirstOrDefault();

        return best is { Score: >= 0.35 } ? best.Code : null;
    }

    private string? InferColorFromStyleText(string? style)
    {
        if (string.IsNullOrWhiteSpace(style)) return null;
        var normalized = Normalize(style);

        if (normalized.Contains("stout") || normalized.Contains("porter") || normalized.Contains("black")) return "Dark";
        if (normalized.Contains("amber") || normalized.Contains("red") || normalized.Contains("vienna")) return "Amber";
        if (normalized.Contains("brown")) return "Brown";
        return "Pale";
    }

    private static string Normalize(string value)
    {
        var chars = value
            .Trim()
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray();
        return new string(chars);
    }

    private static double ScoreStyleMatch(string query, string candidate)
    {
        if (string.IsNullOrWhiteSpace(query) || string.IsNullOrWhiteSpace(candidate)) return 0;
        if (candidate == query) return 1;
        if (candidate.Contains(query) || query.Contains(candidate)) return 0.8;

        var queryTokens = SplitTokens(query);
        var candidateTokens = SplitTokens(candidate);
        if (queryTokens.Count == 0 || candidateTokens.Count == 0) return 0;

        var overlap = queryTokens.Intersect(candidateTokens).Count();
        var union = queryTokens.Union(candidateTokens).Count();
        return union == 0 ? 0 : (double)overlap / union;
    }

    private static HashSet<string> SplitTokens(string normalized)
    {
        var tokens = new HashSet<string>();
        if (string.IsNullOrWhiteSpace(normalized)) return tokens;

        var text = normalized.Trim();
        for (var i = 0; i < text.Length - 2; i++)
        {
            tokens.Add(text.Substring(i, 3));
        }

        return tokens;
    }

    private static int CountFilledFields(CatalogBeerApiDto beer)
    {
        var count = 0;
        if (!string.IsNullOrWhiteSpace(beer.Name)) count++;
        if (!string.IsNullOrWhiteSpace(beer.Style)) count++;
        if (!string.IsNullOrWhiteSpace(beer.Description)) count++;
        if (beer.Abv is not null) count++;
        if (beer.Ibu is not null) count++;
        if (!string.IsNullOrWhiteSpace(beer.Brewer?.Name)) count++;
        if (beer.CbVerified is not null) count++;
        return count;
    }
}

public record CatalogBeerSuggestionDto(
    string Id,
    string Name,
    string? Style,
    double? Abv,
    decimal? Ibu,
    string? BrewerName,
    bool? CbVerified,
    string Source,
    int FilledFields
);

public record CatalogBeerAutofillResponse(
    CatalogBeerAutofillProductDto Product,
    IReadOnlyList<string> MissingFields
);

public class CatalogBeerAutofillProductDto
{
    public string? Name { get; set; }
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public double? StrengthAbv { get; set; }
    public string? Country { get; set; }
    public string? BeerStyle { get; set; }
    public string? BeerColor { get; set; }
    public decimal? BeerIbu { get; set; }
    public decimal? BeerSrm { get; set; }
    public string? ImageUrl { get; set; }
}

public class CatalogBeerListResponse
{
    public List<CatalogBeerApiDto>? Data { get; set; }
}

public class CatalogBeerApiDto
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Style { get; set; }
    public string? Description { get; set; }
    public double? Abv { get; set; }
    public decimal? Ibu { get; set; }
    public bool? CbVerified { get; set; }
    public CatalogBeerBrewerDto? Brewer { get; set; }
}

public class CatalogBeerBrewerDto
{
    public string? Name { get; set; }
}
