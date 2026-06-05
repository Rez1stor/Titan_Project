using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Products;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Domain.Enums;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/recommendations")]
public class RecommendationsController(AppDBContext db, ICurrentUserContext currentUser, IProductQueryService productQuery) : ControllerBase
{
    [HttpGet("{productId:int}")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetSimilar(int productId)
    {
        var baseProduct = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == productId);
        if (baseProduct == null) return NotFound();

        List<AlcoholProduct> candidates = baseProduct switch
        {
            BeerProduct => await db.BeerProducts.Where(p => p.ProductId != productId).Cast<AlcoholProduct>().ToListAsync(),
            WineProduct => await db.WineProducts.Where(p => p.ProductId != productId).Cast<AlcoholProduct>().ToListAsync(),
            _ => await db.AlcoholProducts.Where(p => p.ProductId != productId).ToListAsync(),
        };

        if (candidates.Count == 0)
        {
            return Ok(Array.Empty<ProductDto>());
        }

        var ranked = candidates
            .Select(candidate => new
            {
                Product = candidate,
                Percentage = Math.Clamp((ScoreSimilarity(baseProduct, candidate) / 110.0) * 100.0, 0, 100)
            })
            .Where(item => item.Percentage >= 50)
            .OrderByDescending(item => item.Percentage)
            .ThenByDescending(item => item.Product.ProductId)
            .Take(10)
            .ToList();
        var dtos = await productQuery.MapProductsAsync(ranked.Select(i => i.Product), CancellationToken.None);
        foreach (var dto in dtos)
        {
            var rank = ranked.First(r => r.Product.ProductId == (int)dto.Id);
            dto.SimilarityScore = Math.Round(rank.Percentage, 1);
        }

        return Ok(dtos);
    }

    [HttpGet("for-user")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetForUser()
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
        {
            return Ok(Array.Empty<ProductDto>());
        }

        var userId = currentUser.UserId.Value;
        var user = await db.Users.Include(u => u.Favorites).FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return Ok(new List<ProductDto>());

            var favList = user.Favorites.Select(f => f.ProductId).ToList();

            if (favList.Count > 0)
            {
                // materialize favourite products to determine their concrete categories
                var favProducts = await db.AlcoholProducts.Where(p => favList.Contains(p.ProductId)).ToListAsync();
                var favCategories = favProducts
                    .Select(p => p switch
                    {
                        BeerProduct => (AlcoholCategory?)AlcoholCategory.Beer,
                        WineProduct => (AlcoholCategory?)AlcoholCategory.Wine,
                        _ => null
                    })
                    .Where(c => c.HasValue)
                    .Select(c => c!.Value)
                    .Distinct()
                    .ToList();

                var recCandidates = new List<AlcoholProduct>();
                if (favCategories.Contains(AlcoholCategory.Beer))
                {
                    recCandidates.AddRange(await db.BeerProducts.Where(p => !favList.Contains(p.ProductId)).OrderBy(p => p.ProductId).Take(10).Cast<AlcoholProduct>().ToListAsync());
                }
                if (favCategories.Contains(AlcoholCategory.Wine))
                {
                    recCandidates.AddRange(await db.WineProducts.Where(p => !favList.Contains(p.ProductId)).OrderBy(p => p.ProductId).Take(10).Cast<AlcoholProduct>().ToListAsync());
                }

                if (recCandidates.Count > 0)
                {
                    var recs = recCandidates.Take(10).ToList();
                    return Ok(await productQuery.MapProductsAsync(recs, CancellationToken.None));
                }
            }

        var prefsUser = user;
        if (prefsUser != null)
        {
            var candidates = db.AlcoholProducts.AsQueryable();
            if (prefsUser.TargetAbv.HasValue && prefsUser.AbvTolerance.HasValue)
            {
                var target = prefsUser.TargetAbv.Value;
                var tol = prefsUser.AbvTolerance.Value;
                candidates = candidates.Where(p => Math.Abs(p.Abv - target) <= tol);
            }

            if (prefsUser.MaxPrice.HasValue)
            {
                candidates = candidates.Where(p => p.Price <= prefsUser.MaxPrice.Value);
            }

            var recs = await candidates.Where(p => !favList.Contains(p.ProductId)).Take(10).ToListAsync();
            if (recs.Count > 0) return Ok(await productQuery.MapProductsAsync(recs, CancellationToken.None));
        }

        return Ok(Array.Empty<ProductDto>());
    }

    private static double ScoreSimilarity(AlcoholProduct baseProduct, AlcoholProduct candidate)
    {
        var score = 0d;

        score += ScoreStyle(baseProduct, candidate);
        score += ScoreAbv(baseProduct.Abv, candidate.Abv);
        score += ScoreBitternessOrSweetness(baseProduct, candidate);
        score += ScoreRegion(baseProduct.CountryOfOrigin, candidate.CountryOfOrigin);
        score += ScorePrice(baseProduct.Price, candidate.Price);

        return score;
    }

    private static double ScoreStyle(AlcoholProduct baseProduct, AlcoholProduct candidate)
    {
        return (baseProduct, candidate) switch
        {
            (BeerProduct baseBeer, BeerProduct candidateBeer) when baseBeer.Style == candidateBeer.Style => 50d,
            (WineProduct baseWine, WineProduct candidateWine) when baseWine.Style == candidateWine.Style => 50d,
            _ => 0d,
        };
    }

    private static double ScoreAbv(decimal baseAbv, decimal candidateAbv)
    {
        return ScoreRelativeDifference(baseAbv, candidateAbv, 20d);
    }

    private static double ScoreBitternessOrSweetness(AlcoholProduct baseProduct, AlcoholProduct candidate)
    {
        return (baseProduct, candidate) switch
        {
            (BeerProduct baseBeer, BeerProduct candidateBeer) => ScoreLinearDifference(baseBeer.Ibu, candidateBeer.Ibu, 120d, 20d),
            (WineProduct baseWine, WineProduct candidateWine) => ScoreLinearDifference((decimal)baseWine.Sweetness, (decimal)candidateWine.Sweetness, 4d, 20d),
            _ => 0d,
        };
    }

    private static double ScoreRegion(string baseRegion, string candidateRegion)
    {
        return string.Equals(baseRegion?.Trim(), candidateRegion?.Trim(), StringComparison.OrdinalIgnoreCase)
            ? 10d
            : 0d;
    }

    private static double ScorePrice(decimal basePrice, decimal candidatePrice)
    {
        return ScoreRelativeDifference(basePrice, candidatePrice, 10d);
    }

    private static double ScoreRelativeDifference(decimal left, decimal right, double maxScore)
    {
        var baseline = Math.Max(Math.Max((double)left, (double)right), 1d);
        var differenceRatio = Math.Min(1d, Math.Abs((double)(left - right)) / baseline);
        return Math.Round(maxScore * (1d - differenceRatio), 2);
    }

    private static double ScoreLinearDifference(decimal left, decimal right, double maxDifference, double maxScore)
    {
        if (maxDifference <= 0)
        {
            return 0d;
        }

        var differenceRatio = Math.Min(1d, Math.Abs((double)(left - right)) / maxDifference);
        return Math.Round(maxScore * (1d - differenceRatio), 2);
    }
}