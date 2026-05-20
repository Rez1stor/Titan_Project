using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/recommendations")]
public class RecommendationsController(ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet("{productId:int}")]
    public ActionResult<IEnumerable<ProductDto>> GetSimilar(int productId)
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
    public ActionResult<IEnumerable<ProductDto>> GetForUser()
    {
        if (currentUser.IsAuthenticated &&
            SeedData.Favorites.TryGetValue(currentUser.UserId!.Value.ToString(), out var favs) &&
            favs.Count > 0)
        {
            return Ok(SeedData.Products.Where(p => favs.Contains(p.Id)).ToList());
        }

        return Ok(SeedData.Products.OrderByDescending(p => p.AvgRating).Take(5));
    }
}
