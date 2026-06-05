using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Titan_Project.Server.Infrastructure.Data;
using TitanClassLibrary.Application.Catalog;
using TitanClassLibrary.Contracts.Catalog;

namespace Titan_Project.Server.Infrastructure.Catalog;

public class AdminCatalogBeerService : IAdminCatalogBeerService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BeerCatalogProvider _beerCatalogProvider;
    private readonly AppDBContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public AdminCatalogBeerService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        BeerCatalogProvider beerCatalogProvider,
        AppDBContext db)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _beerCatalogProvider = beerCatalogProvider;
        _db = db;
    }

    public async Task<IReadOnlyList<CatalogBeerSuggestionDto>> SuggestAsync(string? query, int count)
    {
        var limit = Math.Clamp(count, 1, 20);
        var client = BuildClient();
        var existingNames = _db.AlcoholProducts
            .AsNoTracking()
            .Select(product => product.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<CatalogBeerApiDto> candidates;
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
        {
            var listResponse = await client.GetAsync($"/beer?count={Math.Clamp(limit * 5, 20, 100)}");
            if (!listResponse.IsSuccessStatusCode)
                throw new InvalidOperationException("Catalog.beer list request failed.");

            var listJson = await listResponse.Content.ReadAsStringAsync();
            var listPayload = JsonSerializer.Deserialize<CatalogBeerListResponse>(listJson, JsonOptions);
            candidates = (listPayload?.Data ?? new List<CatalogBeerApiDto>())
                .Where(item => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name))
                .Take(Math.Clamp(limit * 5, 20, 100))
                .ToList();
        }
        else
        {
            var response = await client.GetAsync($"/beer/search?q={Uri.EscapeDataString(query.Trim())}&count={limit}");
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException("Catalog.beer search failed.");

            var json = await response.Content.ReadAsStringAsync();
            var payload = JsonSerializer.Deserialize<CatalogBeerListResponse>(json, JsonOptions);
            candidates = (payload?.Data ?? new List<CatalogBeerApiDto>())
                .Where(item => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name))
                .ToList();
        }

        var scored = new List<(CatalogBeerSuggestionDto Item, int Score)>();
        foreach (var candidate in candidates)
        {
            if (existingNames.Contains(candidate.Name!.Trim()))
            {
                continue;
            }

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

        return scored
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Item.Name)
            .Take(limit)
            .Select(item => item.Item)
            .ToList();
    }

    public async Task<CatalogBeerAutofillResponse> GetDetailsAsync(string beerId)
    {
        if (string.IsNullOrWhiteSpace(beerId))
            throw new ArgumentException("beerId is required.");

        if (beerId.StartsWith("local:", StringComparison.OrdinalIgnoreCase))
        {
            if (!int.TryParse(beerId.Substring(6), out var pid))
                throw new ArgumentException("invalid local id.");

            var product = await _db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == pid);
            if (product is null) throw new InvalidOperationException("Local product not found.");

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

            return new CatalogBeerAutofillResponse(payload, missingFields);
        }

        var client = BuildClient();
        var response = await client.GetAsync($"/beer/{Uri.EscapeDataString(beerId)}");
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException("Catalog.beer details request failed.");

        var json = await response.Content.ReadAsStringAsync();
        var beer = JsonSerializer.Deserialize<CatalogBeerApiDto>(json, JsonOptions);
        if (beer is null || string.IsNullOrWhiteSpace(beer.Name))
            throw new InvalidOperationException("Beer not found in external catalog.");

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

        return new CatalogBeerAutofillResponse(payloadExt, missingFieldsExt);
    }

    private HttpClient BuildClient()
    {
        var baseUrl = _configuration["CatalogBeer:BaseUrl"] ?? "https://api.catalog.beer";
        var apiKey = _configuration["CatalogBeer:ApiKey"] ?? "4c7f79a2-ee1a-47c8-a410-d8eb16ce5c88";

        var client = _httpClientFactory.CreateClient();
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
        var styles = _beerCatalogProvider.GetFamilies().SelectMany(f => f.Styles).Select(s => s.Code).Distinct().ToList();

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
