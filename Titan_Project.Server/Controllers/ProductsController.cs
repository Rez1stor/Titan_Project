using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Models.DTOs;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // Це тимчасові дані (mock), поки реальна БД не готова
    private static readonly List<ProductDto> _mockProducts = new()
    {
        new ProductDto 
        { 
            Id = 1, 
            Name = "Guinness Draught", 
            CategoryName = "Beer", 
            StrengthAbv = 4.2, 
            Country = "Ireland", 
            BasePrice = 3.5m, 
            Description = "Iconic Irish stout with a creamy head.",
            AvgRating = 4.7,
            ReviewsCount = 1250
        },
        new ProductDto 
        { 
            Id = 2, 
            Name = "Corona Extra", 
            CategoryName = "Beer", 
            StrengthAbv = 4.5, 
            Country = "Mexico", 
            BasePrice = 2.0m, 
            Description = "Refreshing pale lager.",
            AvgRating = 4.1,
            ReviewsCount = 850
        },
        new ProductDto 
        { 
            Id = 3, 
            Name = "Cabernet Sauvignon", 
            CategoryName = "Wine", 
            StrengthAbv = 13.5, 
            Country = "France", 
            BasePrice = 15.0m, 
            Description = "Full-bodied red wine with dark fruit flavors.",
            AvgRating = 4.6,
            ReviewsCount = 320
        }
    };

    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> GetProducts()
    {
        return Ok(_mockProducts);
    }

    [HttpGet("{id}")]
    public ActionResult<ProductDto> GetProductById(int id)
    {
        var product = _mockProducts.FirstOrDefault(p => p.Id == id);

        if (product == null)
        {
            return NotFound();
        }

        return Ok(product);
    }
}
