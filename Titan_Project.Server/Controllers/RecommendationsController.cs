using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    [HttpGet("{productId}")]
    public ActionResult<IEnumerable<ProductDto>> GetSimilar(Guid productId)
    {
        var baseP = SeedData.Products.FirstOrDefault(p => p.Id == productId);
        if (baseP == null) return NotFound();

        var similar = SeedData.Products
            .Where(p => p.CategoryName == baseP.CategoryName && p.Id != productId)
            .Take(5)
            .ToList();

        return Ok(similar);
    }

    [HttpGet("for-user")]
    public ActionResult<IEnumerable<ProductDto>> GetForUser([FromHeader(Name = "X-User-Id")] string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            // anonymous fallback: return top-rated
            return Ok(SeedData.Products.OrderByDescending(p => p.AvgRating).Take(5));
        }

        if (SeedData.Favorites.TryGetValue(userId, out var favs) && favs.Any())
        {
            var prods = SeedData.Products.Where(p => favs.Contains(p.Id)).ToList();
            return Ok(prods);
        }

        return Ok(SeedData.Products.OrderByDescending(p => p.AvgRating).Take(5));
    }
}
