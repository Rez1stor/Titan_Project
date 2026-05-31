using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Infrastructure.Images;

public sealed class DbProductImageStore : IProductImageStore
{
    private readonly AppDBContext db;

    public DbProductImageStore(AppDBContext db)
    {
        this.db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public string? GetPublicUrl(int productId)
    {
        return db.AlcoholProducts
            .AsNoTracking()
            .Where(product => product.ProductId == productId)
            .Select(product => product.ImageUrl)
            .FirstOrDefault();
    }

    public string? GetSourceUrl(int productId)
    {
        return db.AlcoholProducts
            .AsNoTracking()
            .Where(product => product.ProductId == productId)
            .Select(product => product.ImageSourceUrl)
            .FirstOrDefault();
    }

    public string? GetLocalPath(int productId)
    {
        return db.AlcoholProducts
            .AsNoTracking()
            .Where(product => product.ProductId == productId)
            .Select(product => product.ImageLocalPath)
            .FirstOrDefault();
    }

    public async Task UpsertAsync(int productId, string productName, string? sourceUrl, string? localPath, CancellationToken cancellationToken)
    {
        var product = await db.AlcoholProducts.FirstOrDefaultAsync(item => item.ProductId == productId, cancellationToken);
        if (product is null)
        {
            return;
        }

        product.ImageSourceUrl = sourceUrl;
        product.ImageLocalPath = localPath;
        product.ImageUrl = GetPublicUrlFromLocalPath(localPath);

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string? GetPublicUrlFromLocalPath(string? localPath)
        => string.IsNullOrWhiteSpace(localPath)
            ? null
            : $"/product-images/{Path.GetFileName(localPath).Replace(' ', '-')}";
}