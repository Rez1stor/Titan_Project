using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Titan_Project.Server.Contracts.Seeding;
using Titan_Project.Server.Infrastructure.Images;

namespace Titan_Project.Server.Infrastructure.Seeding;

public sealed class OpenFoodFactsAlcoholSeedService : IAlcoholSeedService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly HttpClient httpClient;
    private readonly IProductImageStore imageStore;
    private readonly ILogger<OpenFoodFactsAlcoholSeedService> logger;
    private readonly string seedRoot;
    private readonly string imageRoot;

    public OpenFoodFactsAlcoholSeedService(HttpClient httpClient, IWebHostEnvironment environment, IProductImageStore imageStore, ILogger<OpenFoodFactsAlcoholSeedService> logger)
    {
        this.httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        this.imageStore = imageStore ?? throw new ArgumentNullException(nameof(imageStore));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        seedRoot = Path.Combine(environment.ContentRootPath, "seed-output");
        imageRoot = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "product-images");
    }

    static OpenFoodFactsAlcoholSeedService()
    {
        JsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    public async Task<AlcoholSeedResultDto> GenerateAsync(IReadOnlyCollection<AlcoholSeedItemDto> products, string? outputFileName, CancellationToken cancellationToken)
    {
        if (products.Count == 0)
        {
            throw new InvalidOperationException("At least one alcohol product is required to generate seed JSON.");
        }

        Directory.CreateDirectory(seedRoot);
        Directory.CreateDirectory(imageRoot);

        var exportItems = new List<AlcoholSeedExportItemDto>(products.Count);

        foreach (var product in products)
        {
            var matched = await FindBestMatchAsync(product.Name, product.CategoryName, cancellationToken);
            var sourceImageUrl = PickImageUrl(matched);
            var localImagePath = sourceImageUrl is null
                ? null
                : await DownloadImageAsync(product.ProductId, product.Name, sourceImageUrl, cancellationToken);

            exportItems.Add(new AlcoholSeedExportItemDto
            {
                Name = product.Name,
                ProductId = product.ProductId,
                CategoryName = product.CategoryName,
                Description = product.Description,
                Abv = product.Abv,
                Price = product.Price,
                CountryOfOrigin = product.CountryOfOrigin,
                BeerIbu = product.BeerIbu,
                BeerSrm = product.BeerSrm,
                BeerColor = product.BeerColor,
                BeerStyle = product.BeerStyle,
                WineColor = product.WineColor,
                WineStyle = product.WineStyle,
                WineSweetness = product.WineSweetness,
                WineAromas = product.WineAromas,
                OpenFoodFactsCode = matched?.Code,
                MatchedProductName = matched?.ProductName,
                SourceImageUrl = sourceImageUrl,
                LocalImagePath = localImagePath,
            });

            if (product.ProductId > 0)
            {
                await imageStore.UpsertAsync(product.ProductId, product.Name, sourceImageUrl, localImagePath, cancellationToken);
            }
        }

        var result = new AlcoholSeedResultDto
        {
            GeneratedAtUtc = DateTime.UtcNow,
            OutputFilePath = Path.Combine(seedRoot, string.IsNullOrWhiteSpace(outputFileName) ? "alcohol-seed.json" : outputFileName),
            ImageDirectory = imageRoot,
            Items = exportItems,
        };

        await File.WriteAllTextAsync(result.OutputFilePath, JsonSerializer.Serialize(result, JsonOptions), cancellationToken);
        return result;
    }

    public async Task<List<Titan_Project.Server.Contracts.Seeding.AlcoholImageCandidateDto>> FindCandidatesAsync(string productName, string categoryName, string? extraFactor, CancellationToken cancellationToken)
    {
        var normalizedCategory = string.IsNullOrWhiteSpace(categoryName) ? "alcohol" : categoryName.Trim();
        var searchTerm = Uri.EscapeDataString($"{productName} {normalizedCategory} {extraFactor ?? string.Empty}");
        var results = new List<Titan_Project.Server.Contracts.Seeding.AlcoholImageCandidateDto>();

        // Search first 5 pages to collect candidates
        for (int page = 1; page <= 5; page++)
        {
            var url = $"https://world.openfoodfacts.org/cgi/search.pl?search_terms={searchTerm}&search_simple=1&action=process&json=1&page_size=20&page={page}&fields=code,product_name,brands,image_url,image_front_url,image_front_thumb_url";
            try
            {
                var response = await httpClient.GetFromJsonAsync<OpenFoodFactsSearchResponseDto>(url, cancellationToken);
                var candidates = response?.Products ?? new List<OpenFoodFactsProductDto>();
                foreach (var c in candidates)
                {
                    var score = ScoreCandidate(productName, categoryName, c);
                    results.Add(new Titan_Project.Server.Contracts.Seeding.AlcoholImageCandidateDto
                    {
                        Code = c.Code,
                        ProductName = c.ProductName,
                        Brands = c.Brands,
                        ImageUrl = c.ImageUrl,
                        ImageFrontUrl = c.ImageFrontUrl,
                        ImageFrontThumbUrl = c.ImageFrontThumbUrl,
                        Score = score
                    });
                }
            }
            catch
            {
                // ignore page errors and continue
            }
        }

        return results.OrderByDescending(r => r.Score).ThenBy(r => r.ProductName).Take(10).ToList();
    }

    private async Task<OpenFoodFactsProductDto?> FindBestMatchAsync(string productName, string categoryName, CancellationToken cancellationToken)
    {
        var normalizedCategory = string.IsNullOrWhiteSpace(categoryName) ? "alcohol" : categoryName.Trim();
        var searchTerm = Uri.EscapeDataString($"{productName} {normalizedCategory}");
        var url = $"https://world.openfoodfacts.org/cgi/search.pl?search_terms={searchTerm}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,brands,image_url,image_front_url,image_front_thumb_url";

        try
        {
            var response = await httpClient.GetFromJsonAsync<OpenFoodFactsSearchResponseDto>(url, cancellationToken);
            var candidates = response?.Products ?? new List<OpenFoodFactsProductDto>();

            if (candidates.Count == 0)
            {
                logger.LogInformation("No Open Food Facts results found for {ProductName} ({Category})", productName, categoryName);
                return null;
            }

            return candidates
                .OrderByDescending(candidate => ScoreCandidate(productName, categoryName, candidate))
                .FirstOrDefault();
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Open Food Facts lookup failed for {ProductName} ({Category})", productName, categoryName);
            return null;
        }
        catch (TaskCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (TaskCanceledException ex)
        {
            logger.LogWarning(ex, "Open Food Facts lookup timed out for {ProductName} ({Category})", productName, categoryName);
            return null;
        }
        catch (NotSupportedException ex)
        {
            logger.LogWarning(ex, "Open Food Facts response could not be parsed for {ProductName} ({Category})", productName, categoryName);
            return null;
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Open Food Facts response was invalid for {ProductName} ({Category})", productName, categoryName);
            return null;
        }
    }

    private static int ScoreCandidate(string productName, string categoryName, OpenFoodFactsProductDto candidate)
    {
        var score = 0;
        var target = productName.Trim();
        var normalizedCategory = categoryName.Trim();
        var candidateName = candidate.ProductName?.Trim() ?? string.Empty;
        var brands = candidate.Brands?.Trim() ?? string.Empty;

        if (candidateName.Equals(target, StringComparison.OrdinalIgnoreCase))
        {
            score += 100;
        }

        if (candidateName.Contains(target, StringComparison.OrdinalIgnoreCase))
        {
            score += 50;
        }

        if (!string.IsNullOrWhiteSpace(normalizedCategory) && candidateName.Contains(normalizedCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 20;
        }

        if (brands.Contains(target, StringComparison.OrdinalIgnoreCase))
        {
            score += 20;
        }

        if (!string.IsNullOrWhiteSpace(candidate.ImageFrontUrl))
        {
            score += 10;
        }

        if (!string.IsNullOrWhiteSpace(candidate.ImageUrl))
        {
            score += 5;
        }

        return score;
    }

    private static string? PickImageUrl(OpenFoodFactsProductDto? product)
    {
        if (product is null)
        {
            return null;
        }

        return product.ImageFrontUrl ?? product.ImageFrontThumbUrl ?? product.ImageUrl;
    }

    private async Task<string?> DownloadImageAsync(int productId, string productName, string imageUrl, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(imageUrl, cancellationToken);
            response.EnsureSuccessStatusCode();

            var extension = ResolveImageExtension(imageUrl, response.Content.Headers.ContentType?.MediaType);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = ".jpg";
            }

            var suffix = productId > 0 ? $"-{productId}" : string.Empty;
            var fileName = $"{SanitizeFileName(productName)}{suffix}{extension}";
            var localPath = Path.Combine(imageRoot, fileName);

            await using var fileStream = File.Create(localPath);
            await response.Content.CopyToAsync(fileStream, cancellationToken);

            return localPath;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to download image for {ProductName} from {ImageUrl}", productName, imageUrl);
            return null;
        }
    }

    private static string? ResolveImageExtension(string imageUrl, string? contentType)
    {
        var extension = Path.GetExtension(new Uri(imageUrl).AbsolutePath).ToLowerInvariant();
        if (extension is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".bmp")
        {
            return extension == ".jpeg" ? ".jpg" : extension;
        }

        return contentType?.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            "image/bmp" => ".bmp",
            _ => null
        };
    }

    private static string SanitizeFileName(string value)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var cleaned = new string(value.Select(character => invalidChars.Contains(character) ? '-' : character).ToArray());
        return string.Join('-', cleaned.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
    }

    private sealed record OpenFoodFactsSearchResponseDto(
        [property: JsonPropertyName("products")] List<OpenFoodFactsProductDto> Products);

    private sealed record OpenFoodFactsProductDto(
        [property: JsonPropertyName("code")] string? Code,
        [property: JsonPropertyName("product_name")] string? ProductName,
        [property: JsonPropertyName("brands")] string? Brands,
        [property: JsonPropertyName("image_url")] string? ImageUrl,
        [property: JsonPropertyName("image_front_url")] string? ImageFrontUrl,
        [property: JsonPropertyName("image_front_thumb_url")] string? ImageFrontThumbUrl);
}