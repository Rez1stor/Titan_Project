using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> GetProducts()
    {
        return Ok(SeedData.Products);
    }

    [HttpGet("{id}")]
    public ActionResult<ProductDto> GetProductById(int id)
    {
        var product = SeedData.Products.FirstOrDefault(p => p.Id == id);

        if (product == null)
        {
            return NotFound();
        }

        return Ok(product);
    }
} 

