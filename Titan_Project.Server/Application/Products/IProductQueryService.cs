using Titan_Project.Server.Contracts.Common;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Application.Products;

public interface IProductQueryService
{
    Task<PagedResult<ProductDto>> SearchAsync(ProductQueryOptions options, CancellationToken ct);
    Task<ProductDto?> GetByIdAsync(int id, CancellationToken ct);
    Task<ProductDto?> GetByNameAsync(string name, CancellationToken ct);
    Task<IReadOnlyList<ProductDto>> MapProductsAsync(IEnumerable<AlcoholProduct> products, CancellationToken ct);
}
