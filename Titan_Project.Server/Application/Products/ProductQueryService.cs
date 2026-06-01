using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Contracts.Common;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Domain.Enums;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;
using Titan_Project.Server.Infrastructure.Images;

namespace Titan_Project.Server.Application.Products;

public sealed class ProductQueryService(AppDBContext db, IProductImageStore imageStore) : IProductQueryService
{
    public async Task<PagedResult<ProductDto>> SearchAsync(ProductQueryOptions options, CancellationToken ct)
    {
        var page = Math.Max(1, options.Page);
        var pageSize = Math.Clamp(options.PageSize, 1, 100);

        var query = db.AlcoholProducts.AsQueryable();
        query = ApplyCategoryFilter(query, options.Category);
        query = ApplySearchFilter(query, options.Search);
        query = ApplyCountryFilter(query, options.Country);
        query = await ApplyPriceBandFilterAsync(query, options, ct);
        query = ApplyBeerFilters(query, options);
        query = ApplyWineFilters(query, options);

        var totalCount = await query.CountAsync(ct);
        var products = await query.ToListAsync(ct);
        var productIds = products.Select(p => p.ProductId).ToList();
        var (avgRatings, reviewCounts) = await ReviewStatsQuery.GetForProductsAsync(db, productIds, ct);

        var sorted = SortProducts(products, avgRatings, options.SortBy, options.SortDir);
        var pageItems = sorted
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p =>
            {
                avgRatings.TryGetValue(p.ProductId, out var avgRating);
                reviewCounts.TryGetValue(p.ProductId, out var reviewsCount);
                return ProductDtoMapper.Map(p, avgRating, reviewsCount, imageStore);
            })
            .ToList();

        return new PagedResult<ProductDto>
        {
            Items = pageItems,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
        };
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        var product = await db.AlcoholProducts.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (product is null)
            return null;

        var (avgRatings, reviewCounts) = await ReviewStatsQuery.GetForProductsAsync(db, [product.ProductId], ct);
        avgRatings.TryGetValue(product.ProductId, out var avgRating);
        reviewCounts.TryGetValue(product.ProductId, out var reviewsCount);
        return ProductDtoMapper.Map(product, avgRating, reviewsCount, imageStore);
    }

    public async Task<IReadOnlyList<ProductDto>> MapProductsAsync(IEnumerable<AlcoholProduct> products, CancellationToken ct)
    {
        var list = products.ToList();
        var productIds = list.Select(p => p.ProductId).ToList();
        var (avgRatings, reviewCounts) = await ReviewStatsQuery.GetForProductsAsync(db, productIds, ct);
        return ProductDtoMapper.MapMany(list, avgRatings, reviewCounts, imageStore);
    }

    private async Task<IQueryable<AlcoholProduct>> ApplyPriceBandFilterAsync(
        IQueryable<AlcoholProduct> query,
        ProductQueryOptions options,
        CancellationToken ct)
    {
        var minPrice = options.MinPrice;
        var maxPrice = options.MaxPrice;

        if (!string.IsNullOrWhiteSpace(options.PriceBand) &&
            !options.PriceBand.Equals("Any", StringComparison.OrdinalIgnoreCase))
        {
            var scoped = ApplyCategoryFilter(db.AlcoholProducts.AsQueryable(), options.Category);
            if (await scoped.AnyAsync(ct))
            {
                var average = await scoped.AverageAsync(p => p.Price, ct);
                (minPrice, maxPrice) = ResolvePriceBand(average, options.PriceBand, minPrice, maxPrice);
            }
        }

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        return query;
    }

    private static IQueryable<AlcoholProduct> ApplyCategoryFilter(IQueryable<AlcoholProduct> query, string? category)
    {
        if (string.IsNullOrWhiteSpace(category) || category.Equals("All", StringComparison.OrdinalIgnoreCase))
            return query;

        return category.Trim().ToLowerInvariant() switch
        {
            "beer" => query.OfType<BeerProduct>(),
            "wine" => query.OfType<WineProduct>(),
            "other" => query.Where(p => p.Category == AlcoholCategory.Other),
            _ => query,
        };
    }

    private static IQueryable<AlcoholProduct> ApplySearchFilter(IQueryable<AlcoholProduct> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
            return query;

        var term = search.Trim();
        return query.Where(p =>
            EF.Functions.ILike(p.Name, $"%{term}%") ||
            EF.Functions.ILike(p.Description, $"%{term}%"));
    }

    private static IQueryable<AlcoholProduct> ApplyCountryFilter(IQueryable<AlcoholProduct> query, string? country)
    {
        if (string.IsNullOrWhiteSpace(country))
            return query;

        var value = country.Trim();
        return query.Where(p => EF.Functions.ILike(p.CountryOfOrigin, $"%{value}%"));
    }

    private static (decimal? MinPrice, decimal? MaxPrice) ResolvePriceBand(
        decimal average,
        string priceBand,
        decimal? minPrice,
        decimal? maxPrice)
    {
        var budgetMax = average * 0.85m;
        var classicMax = average * 1.05m;
        var premiumMax = average * 1.3m;

        return priceBand.Trim().ToLowerInvariant() switch
        {
            "budget" => (null, budgetMax),
            "classic" => (budgetMax, classicMax),
            "premium" => (classicMax, premiumMax),
            "luxury" => (premiumMax, null),
            _ => (minPrice, maxPrice),
        };
    }

    private static IQueryable<AlcoholProduct> ApplyBeerFilters(IQueryable<AlcoholProduct> query, ProductQueryOptions options)
    {
        if (!IsCategory(options.Category, "Beer"))
            return query;

        var beerQuery = query.OfType<BeerProduct>();

        if (!string.IsNullOrWhiteSpace(options.BeerStyle))
        {
            var style = options.BeerStyle.Trim();
            beerQuery = beerQuery.Where(p => EF.Functions.ILike(p.Style.ToString(), $"%{style}%"));
        }

        if (!string.IsNullOrWhiteSpace(options.BeerColor))
        {
            var color = options.BeerColor.Trim();
            beerQuery = beerQuery.Where(p => EF.Functions.ILike(p.Color.ToString(), $"%{color}%"));
        }

        if (options.MaxIbu.HasValue)
            beerQuery = beerQuery.Where(p => p.Ibu <= options.MaxIbu.Value);

        if (options.MaxSrm.HasValue)
            beerQuery = beerQuery.Where(p => p.Srm <= options.MaxSrm.Value);

        return beerQuery;
    }

    private static IQueryable<AlcoholProduct> ApplyWineFilters(IQueryable<AlcoholProduct> query, ProductQueryOptions options)
    {
        if (!IsCategory(options.Category, "Wine"))
            return query;

        var wineQuery = query.OfType<WineProduct>();

        if (!string.IsNullOrWhiteSpace(options.WineStyle))
        {
            var style = options.WineStyle.Trim();
            wineQuery = wineQuery.Where(p => EF.Functions.ILike(p.Style.ToString(), $"%{style}%"));
        }

        if (!string.IsNullOrWhiteSpace(options.WineColor))
        {
            var color = options.WineColor.Trim();
            wineQuery = wineQuery.Where(p => EF.Functions.ILike(p.Color.ToString(), $"%{color}%"));
        }

        if (!string.IsNullOrWhiteSpace(options.WineSweetness))
        {
            var sweetness = options.WineSweetness.Trim();
            wineQuery = wineQuery.Where(p => EF.Functions.ILike(p.Sweetness.ToString(), $"%{sweetness}%"));
        }

        return wineQuery;
    }

    private static bool IsCategory(string? category, string expected) =>
        !string.IsNullOrWhiteSpace(category) &&
        category.Equals(expected, StringComparison.OrdinalIgnoreCase);

    private static List<AlcoholProduct> SortProducts(
        List<AlcoholProduct> products,
        IReadOnlyDictionary<int, double> avgRatings,
        string? sortBy,
        string? sortDir)
    {
        var descending = sortDir?.Equals("desc", StringComparison.OrdinalIgnoreCase) == true;

        return (sortBy?.ToLowerInvariant() ?? "name") switch
        {
            "price" => descending
                ? products.OrderByDescending(p => p.Price).ToList()
                : products.OrderBy(p => p.Price).ToList(),
            "abv" => descending
                ? products.OrderByDescending(p => p.Abv).ToList()
                : products.OrderBy(p => p.Abv).ToList(),
            "rating" => descending
                ? products.OrderByDescending(p => avgRatings.GetValueOrDefault(p.ProductId)).ToList()
                : products.OrderBy(p => avgRatings.GetValueOrDefault(p.ProductId)).ToList(),
            _ => descending
                ? products.OrderByDescending(p => p.Name).ToList()
                : products.OrderBy(p => p.Name).ToList(),
        };
    }
}
