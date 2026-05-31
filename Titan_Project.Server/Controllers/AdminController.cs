using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Domain.Enums;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Titan_Project.Server.Application.Security.Roles.Admin + "," + Titan_Project.Server.Application.Security.Roles.Moderator)]
public class AdminController(AppDBContext db) : ControllerBase
{
    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> AddProduct([FromBody] ProductDto dto)
    {
        if (!TryBuildProduct(dto, out var product, out var error))
            return BadRequest(new { message = error });

        db.Add(product);
        await db.SaveChangesAsync();

        return Created($"/api/products/{product.ProductId}", MapProduct(product));
    }

    [HttpPut("products/{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductDto dto)
    {
        var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == id);
        if (product == null) return NotFound(new { message = "Product not found." });

        if (!TryUpdateProduct(product, dto, out var error))
            return BadRequest(new { message = error });

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("products/{id}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == id);
        if (product == null) return NotFound(new { message = "Product not found." });

        db.AlcoholProducts.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static bool TryBuildProduct(ProductDto dto, out AlcoholProduct product, out string error)
    {
        product = null!;
        error = string.Empty;

        if (dto is null)
        {
            error = "Request body is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            error = "Product name is required.";
            return false;
        }

        var category = NormalizeCategory(dto.CategoryName);
        if (category is null)
        {
            error = "Category must be Beer or Wine. The legacy 'All' value is not allowed for product creation.";
            return false;
        }

        if (category == AlcoholCategory.Beer)
        {
            product = new BeerProduct
            {
                Name = dto.Name.Trim(),
                Description = NormalizeDescription(dto.Description),
                Abv = (decimal)(dto.StrengthAbv ?? 0),
                Price = dto.BasePrice ?? 0m,
                CountryOfOrigin = NormalizeCountry(dto.Country),
                Ibu = dto.BeerIbu ?? 0m,
                Srm = dto.BeerSrm ?? 0m,
                Color = ParseEnum(dto.BeerColor, BeerColor.Pale),
                Style = ParseEnum(dto.BeerStyle, BeerStyle.Pilsner),
                ImageUrl = NormalizeImageUrl(dto.ImageUrl),
                ImageSourceUrl = null,
                ImageLocalPath = null,
            };

            return true;
        }

        product = new WineProduct
        {
            Name = dto.Name.Trim(),
            Description = NormalizeDescription(dto.Description),
            Abv = (decimal)(dto.StrengthAbv ?? 0),
            Price = dto.BasePrice ?? 0m,
            CountryOfOrigin = NormalizeCountry(dto.Country),
            Color = ParseEnum(dto.WineColor, WineColor.Red),
            Style = ParseEnum(dto.WineStyle, WineStyle.Still),
            Sweetness = ParseEnum(dto.WineSweetness, WineSweetness.Dry),
            Aromas = ParseAromas(dto.WineAromas),
            ImageUrl = NormalizeImageUrl(dto.ImageUrl),
            ImageSourceUrl = null,
            ImageLocalPath = null,
        };

        return true;
    }

    private static bool TryUpdateProduct(AlcoholProduct product, ProductDto dto, out string error)
    {
        error = string.Empty;

        if (dto is null)
        {
            error = "Request body is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            error = "Product name is required.";
            return false;
        }

        product.Name = dto.Name.Trim();
        product.Description = NormalizeDescription(dto.Description);
        product.Abv = (decimal)(dto.StrengthAbv ?? 0);
        product.Price = dto.BasePrice ?? 0m;
        product.CountryOfOrigin = NormalizeCountry(dto.Country);
        product.ImageUrl = NormalizeImageUrl(dto.ImageUrl);
        product.ImageSourceUrl = null;
        product.ImageLocalPath = null;

        var category = NormalizeCategory(dto.CategoryName);
        if (category is null)
        {
            error = "Category must be Beer or Wine. The legacy 'All' value is not allowed for product creation.";
            return false;
        }

        if (product is BeerProduct beer)
        {
            if (category != AlcoholCategory.Beer)
            {
                error = "Changing an existing product from Beer to Wine is not supported yet.";
                return false;
            }

            beer.Ibu = dto.BeerIbu ?? 0m;
            beer.Srm = dto.BeerSrm ?? 0m;
            beer.Color = ParseEnum(dto.BeerColor, BeerColor.Pale);
            beer.Style = ParseEnum(dto.BeerStyle, BeerStyle.Pilsner);
            return true;
        }

        if (product is WineProduct wine)
        {
            if (category != AlcoholCategory.Wine)
            {
                error = "Changing an existing product from Wine to Beer is not supported yet.";
                return false;
            }

            wine.Color = ParseEnum(dto.WineColor, WineColor.Red);
            wine.Style = ParseEnum(dto.WineStyle, WineStyle.Still);
            wine.Sweetness = ParseEnum(dto.WineSweetness, WineSweetness.Dry);
            wine.Aromas = ParseAromas(dto.WineAromas);
            return true;
        }

        error = "Unsupported product type.";
        return false;
    }

    private static ProductDto MapProduct(AlcoholProduct product)
    {
        var beer = product as BeerProduct;
        var wine = product as WineProduct;

        return new ProductDto
        {
            Id = product.ProductId,
            Name = product.Name,
            CategoryName = product.Category.ToString(),
            StrengthAbv = (double)product.Abv,
            Country = product.CountryOfOrigin,
            BasePrice = product.Price,
            Description = product.Description,
            AvgRating = 0,
            ReviewsCount = 0,
            BeerIbu = beer?.Ibu,
            BeerSrm = beer?.Srm,
            BeerColor = beer != null ? beer.Color.ToString() : null,
            BeerStyle = beer != null ? beer.Style.ToString() : null,
            WineColor = wine != null ? wine.Color.ToString() : null,
            WineStyle = wine != null ? wine.Style.ToString() : null,
            WineSweetness = wine != null ? wine.Sweetness.ToString() : null,
            WineAromas = wine != null ? wine.Aromas.Select(aroma => aroma.ToString()).ToList() : new List<string>(),
            ImageUrl = product.ImageUrl,
            ImageSourceUrl = product.ImageSourceUrl,
            ImageLocalPath = product.ImageLocalPath,
            BeerColorValue = beer != null ? (int?)beer.Color : null,
            BeerStyleValue = beer != null ? (int?)beer.Style : null,
            WineColorValue = wine != null ? (int?)wine.Color : null,
            WineStyleValue = wine != null ? (int?)wine.Style : null,
        };
    }

    private static AlcoholCategory? NormalizeCategory(string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return null;

        return categoryName.Trim().Equals("Beer", StringComparison.OrdinalIgnoreCase)
            ? AlcoholCategory.Beer
            : categoryName.Trim().Equals("Wine", StringComparison.OrdinalIgnoreCase)
                ? AlcoholCategory.Wine
                : null;
    }

    private static string NormalizeDescription(string? description)
        => string.IsNullOrWhiteSpace(description) ? "No description provided." : description.Trim();

    private static string NormalizeCountry(string? country)
        => string.IsNullOrWhiteSpace(country) ? "Unknown" : country.Trim();

    private static string? NormalizeImageUrl(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return null;
        return Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) || uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            ? imageUrl.Trim()
            : null;
    }

    private static List<WineAroma> ParseAromas(IEnumerable<string>? aromas)
        => aromas == null
            ? new List<WineAroma>()
            : aromas
                .Select(value => ParseEnum(value, WineAroma.Other))
                .Distinct()
                .ToList();

    private static TEnum ParseEnum<TEnum>(string? value, TEnum fallback)
        where TEnum : struct, Enum
        => !string.IsNullOrWhiteSpace(value) && Enum.TryParse<TEnum>(value.Trim(), ignoreCase: true, out var parsed)
            ? parsed
            : fallback;
}
