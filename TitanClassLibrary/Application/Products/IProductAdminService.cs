using System.Threading.Tasks;
using Titan_Project.Server.Contracts.Products;

namespace TitanClassLibrary.Application.Products;

public interface IProductAdminService
{
    Task<ProductDto> CreateProductAsync(ProductDto dto);
    Task UpdateProductAsync(int id, ProductDto dto);
    Task DeleteProductAsync(int id);
}
