using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;
using Titan_Project.Server.Infrastructure.Images;
using Titan_Project.Server.Domain.Model;
using System.Linq;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly AppDBContext db;
    private readonly IProductImageStore imageStore;

    public ProductsController(AppDBContext db, IProductImageStore imageStore)
    {
        this.db = db ?? throw new ArgumentNullException(nameof(db));
        this.imageStore = imageStore ?? throw new ArgumentNullException(nameof(imageStore));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        var products = await db.AlcoholProducts.ToListAsync();
        var avgRatings = await db.Reviews
            .GroupBy(r => r.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                AvgRating = group.Average(r => (double)r.Rating)
            })
            .ToDictionaryAsync(x => x.ProductId, x => x.AvgRating);

        var reviewCounts = await db.Reviews
            .GroupBy(r => r.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                ReviewsCount = group.Count()
            })
            .ToDictionaryAsync(x => x.ProductId, x => x.ReviewsCount);

        var productDtos = products.Select(p => MapProduct(p, avgRatings, reviewCounts)).ToList();

        return Ok(productDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        var p = await db.AlcoholProducts.FirstOrDefaultAsync(x => x.ProductId == id);
        if (p == null) return NotFound();
        var ratings = await db.Reviews.Where(r => r.ProductId == p.ProductId).Select(r => (double?)r.Rating).ToListAsync();
        var avgRating = ratings.Count > 0 ? ratings.Average() ?? 0.0 : 0.0;
        var reviewsCount = ratings.Count;
        var dto = MapProduct(p, avgRating, reviewsCount);

        return Ok(dto);
    }

    private ProductDto MapProduct(AlcoholProduct product, IReadOnlyDictionary<int, double> avgRatings, IReadOnlyDictionary<int, int> reviewCounts)
    {
        avgRatings.TryGetValue(product.ProductId, out var avgRating);
        reviewCounts.TryGetValue(product.ProductId, out var reviewsCount);
        return MapProduct(product, avgRating, reviewsCount);
    }

    private ProductDto MapProduct(AlcoholProduct product, double avgRating, int reviewsCount)
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
            BeerColor = beer != null ? beer.Color.ToString() : null,
            BeerStyle = beer != null ? beer.Style.ToString() : null,
            WineColor = wine != null ? wine.Color.ToString() : null,
            WineStyle = wine != null ? wine.Style.ToString() : null,
            WineSweetness = wine != null ? wine.Sweetness.ToString() : null,
            WineAromas = wine != null ? wine.Aromas.Select(aroma => aroma.ToString()).ToList() : new List<string>(),
            ImageUrl = imageStore.GetPublicUrl(product.ProductId),
            ImageSourceUrl = imageStore.GetSourceUrl(product.ProductId),
            ImageLocalPath = imageStore.GetLocalPath(product.ProductId),
            BeerColorValue = beer != null ? (int?)beer.Color : null,
            BeerStyleValue = beer != null ? (int?)beer.Style : null,
            WineColorValue = wine != null ? (int?)wine.Color : null,
            WineStyleValue = wine != null ? (int?)wine.Style : null,
        };
    }
}

