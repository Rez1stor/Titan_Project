using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Products;
using Titan_Project.Server.Contracts.Users;
using Titan_Project.Server.Infrastructure.Data;

[ApiController]
[Route("api/library")]
[Authorize]
public class LibraryController(
    AppDBContext db,
    ICurrentUserContext currentUser,
    IProductQueryService productQuery) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetLibrary(CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null)
            return NotFound();

        var favorites = await productQuery.MapProductsAsync(user.Favorites, ct);
        var prefs = new UserPreferencesDto
        {
            TargetAbv = user.TargetAbv,
            AbvTolerance = user.AbvTolerance,
            MaxPrice = user.MaxPrice,
        };

        return Ok(new { favorites, preferences = prefs });
    }

    [HttpPut("prefs")]
    public async Task<ActionResult> SetPreferences([FromBody] UserPreferencesDto prefs, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (user is null)
            return NotFound();

        user.TargetAbv = prefs.TargetAbv;
        user.AbvTolerance = prefs.AbvTolerance;
        user.MaxPrice = prefs.MaxPrice;
        user.PreferredTagsJson = prefs.PreferredTags != null
            ? System.Text.Json.JsonSerializer.Serialize(prefs.PreferredTags)
            : "[]";

        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
