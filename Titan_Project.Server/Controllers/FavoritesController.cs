using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> GetFavorites([FromHeader(Name = "X-User-Id")] string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return Ok(new List<ProductDto>());

        if (!SeedData.Favorites.TryGetValue(userId, out var favs) || favs.Count == 0) return Ok(new List<ProductDto>());

        var items = SeedData.Products.Where(p => favs.Contains(p.Id)).ToList();
        return Ok(items);
    }

    [HttpPost("{productId}")]
    public ActionResult AddFavorite(Guid productId, [FromHeader(Name = "X-User-Id")] string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var list = SeedData.Favorites.GetOrAdd(userId, _ => new List<Guid>());
        if (!list.Contains(productId)) list.Add(productId);

        return NoContent();
    }

    [HttpDelete("{productId}")]
    public ActionResult RemoveFavorite(Guid productId, [FromHeader(Name = "X-User-Id")] string? userId)
    {
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (SeedData.Favorites.TryGetValue(userId, out var list)) list.Remove(productId);
        return NoContent();
    }
}
