using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController(ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> GetFavorites()
    {
        var key = currentUser.UserId!.Value.ToString();
        if (!SeedData.Favorites.TryGetValue(key, out var favs) || favs.Count == 0)
            return Ok(new List<ProductDto>());

        var items = SeedData.Products.Where(p => favs.Contains(p.Id)).ToList();
        return Ok(items);
    }

    [HttpPost("{productId:int}")]
    public ActionResult AddFavorite(int productId)
    {
        var key = currentUser.UserId!.Value.ToString();
        var list = SeedData.Favorites.GetOrAdd(key, _ => new List<int>());
        if (!list.Contains(productId)) list.Add(productId);

        return NoContent();
    }

    [HttpDelete("{productId:int}")]
    public ActionResult RemoveFavorite(int productId)
    {
        var key = currentUser.UserId!.Value.ToString();
        if (SeedData.Favorites.TryGetValue(key, out var list))
            list.Remove(productId);

        return NoContent();
    }
}
