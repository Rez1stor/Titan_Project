using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Application.Products;

public static class ReviewStatsQuery
{
    public static async Task<(Dictionary<int, double> AvgRatings, Dictionary<int, int> ReviewCounts)> GetForProductsAsync(
        AppDBContext db,
        IReadOnlyCollection<int> productIds,
        CancellationToken ct)
    {
        if (productIds.Count == 0)
            return ([], []);

        var avgRatings = await db.Reviews
            .Where(r => productIds.Contains(r.ProductId))
            .GroupBy(r => r.ProductId)
            .Select(group => new { ProductId = group.Key, AvgRating = group.Average(r => (double)r.Rating) })
            .ToDictionaryAsync(x => x.ProductId, x => x.AvgRating, ct);

        var reviewCounts = await db.Reviews
            .Where(r => productIds.Contains(r.ProductId))
            .GroupBy(r => r.ProductId)
            .Select(group => new { ProductId = group.Key, ReviewsCount = group.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.ReviewsCount, ct);

        return (avgRatings, reviewCounts);
    }
}
