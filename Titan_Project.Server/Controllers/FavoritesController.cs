using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Products;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController(
    AppDBContext db,
    ICurrentUserContext currentUser,
    IProductQueryService productQuery) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetFavorites(CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null)
            return Ok(Array.Empty<ProductDto>());

        var products = await productQuery.MapProductsAsync(user.Favorites, ct);
        return Ok(products);
    }

    [HttpPost("{productId:int}")]
    public async Task<ActionResult> AddFavorite(int productId, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null)
            return NotFound();

        var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == productId, ct);
        if (product is null)
            return NotFound();

        if (!user.Favorites.Any(p => p.ProductId == productId))
        {
            user.Favorites.Add(product);
            await db.SaveChangesAsync(ct);
        }

        return NoContent();
    }

    [HttpDelete("{productId:int}")]
    public async Task<ActionResult> RemoveFavorite(int productId, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null)
            return NotFound();

        var product = user.Favorites.FirstOrDefault(p => p.ProductId == productId);
        if (product is not null)
        {
            user.Favorites.Remove(product);
            await db.SaveChangesAsync(ct);
        }

        return NoContent();
    }
}
