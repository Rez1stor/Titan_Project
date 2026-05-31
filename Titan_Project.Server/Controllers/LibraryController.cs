using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Contracts.Users;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;
using Titan_Project.Server.Infrastructure.Images;

[ApiController]
[Route("api/library")]
[Authorize]
public class LibraryController(AppDBContext db, ICurrentUserContext currentUser, IProductImageStore imageStore) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetLibrary()
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return NotFound();

        var favProducts = user.Favorites.ToList();
        var productIds = favProducts.Select(p => p.ProductId).ToList();

        var avgRatings = await db.Reviews
            .Where(r => productIds.Contains(r.ProductId))
            .GroupBy(r => r.ProductId)
            .Select(g => new { ProductId = g.Key, Avg = g.Average(r => (double)r.Rating) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Avg);

        var reviewCounts = await db.Reviews
            .Where(r => productIds.Contains(r.ProductId))
            .GroupBy(r => r.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count);

        var favorites = favProducts.Select(p => {
            var beer = p as BeerProduct;
            var wine = p as WineProduct;
            avgRatings.TryGetValue(p.ProductId, out var avg);
            reviewCounts.TryGetValue(p.ProductId, out var cnt);
            return new ProductDto
            {
                Id = p.ProductId,
                Name = p.Name,
                CategoryName = p.Category.ToString(),
                StrengthAbv = (double)p.Abv,
                Country = p.CountryOfOrigin,
                BasePrice = p.Price,
                Description = p.Description,
                AvgRating = avg,
                ReviewsCount = cnt,
                BeerIbu = beer?.Ibu,
                BeerSrm = beer?.Srm,
                BeerColor = beer != null ? beer.Color.ToString() : null,
                BeerStyle = beer != null ? beer.Style.ToString() : null,
                WineColor = wine != null ? wine.Color.ToString() : null,
                WineStyle = wine != null ? wine.Style.ToString() : null,
                WineSweetness = wine != null ? wine.Sweetness.ToString() : null,
                ImageUrl = imageStore.GetPublicUrl(p.ProductId),
                ImageSourceUrl = imageStore.GetSourceUrl(p.ProductId),
                ImageLocalPath = imageStore.GetLocalPath(p.ProductId),
                BeerColorValue = beer != null ? (int?)beer.Color : null,
                BeerStyleValue = beer != null ? (int?)beer.Style : null,
                WineColorValue = wine != null ? (int?)wine.Color : null,
                WineStyleValue = wine != null ? (int?)wine.Style : null,
            };
        }).ToList();

        var prefs = new UserPreferencesDto
        {
            TargetAbv = user.TargetAbv,
            AbvTolerance = user.AbvTolerance,
            MaxPrice = user.MaxPrice
        };

        return Ok(new { favorites, preferences = prefs });
    }

    [HttpPut("prefs")]
    public async Task<ActionResult> SetPreferences([FromBody] UserPreferencesDto prefs)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized();

        var userId = currentUser.UserId.Value;
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return NotFound();

        user.TargetAbv = prefs.TargetAbv;
        user.AbvTolerance = prefs.AbvTolerance;
        user.MaxPrice = prefs.MaxPrice;
        user.PreferredTagsJson = prefs.PreferredTags != null ? System.Text.Json.JsonSerializer.Serialize(prefs.PreferredTags) : "[]";

        await db.SaveChangesAsync();
        return NoContent();
    }
}
