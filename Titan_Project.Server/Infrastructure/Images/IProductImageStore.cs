namespace Titan_Project.Server.Infrastructure.Images;

public interface IProductImageStore
{
    string? GetPublicUrl(int productId);
    string? GetSourceUrl(int productId);
    string? GetLocalPath(int productId);
    Task UpsertAsync(int productId, string productName, string? sourceUrl, string? localPath, CancellationToken cancellationToken);
}