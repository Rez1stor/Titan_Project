using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Images;

namespace Titan_Project.Server.Application.Products;

public static class ProductDtoMapper
{
    public static ProductDto Map(
        AlcoholProduct product,
        double avgRating,
        int reviewsCount,
        IProductImageStore imageStore)
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
            AvgRating = avgRating,
            ReviewsCount = reviewsCount,
            BeerIbu = beer?.Ibu,
            BeerSrm = beer?.Srm,
            BeerColor = beer?.Color.ToString(),
            BeerStyle = beer?.Style.ToString(),
            WineColor = wine?.Color.ToString(),
            WineStyle = wine?.Style.ToString(),
            WineSweetness = wine?.Sweetness.ToString(),
            WineAromas = wine?.Aromas.Select(aroma => aroma.ToString()).ToList() ?? [],
            ImageUrl = imageStore.GetPublicUrl(product.ProductId),
            ImageSourceUrl = imageStore.GetSourceUrl(product.ProductId),
            ImageLocalPath = imageStore.GetLocalPath(product.ProductId),
            BeerColorValue = beer != null ? (int?)beer.Color : null,
            BeerStyleValue = beer != null ? (int?)beer.Style : null,
            WineColorValue = wine != null ? (int?)wine.Color : null,
            WineStyleValue = wine != null ? (int?)wine.Style : null,
        };
    }

    public static IReadOnlyList<ProductDto> MapMany(
        IEnumerable<AlcoholProduct> products,
        IReadOnlyDictionary<int, double> avgRatings,
        IReadOnlyDictionary<int, int> reviewCounts,
        IProductImageStore imageStore) =>
        products.Select(product =>
        {
            avgRatings.TryGetValue(product.ProductId, out var avgRating);
            reviewCounts.TryGetValue(product.ProductId, out var reviewsCount);
            return Map(product, avgRating, reviewsCount, imageStore);
        }).ToList();
}
