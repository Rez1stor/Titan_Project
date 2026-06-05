using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Titan_Project.Server.Contracts.Products;
using TitanClassLibrary.Application.Products;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Titan_Project.Server.Application.Security.Roles.Admin + "," + Titan_Project.Server.Application.Security.Roles.Moderator)]
public class AdminController(IProductAdminService productAdminService) : ControllerBase
{
    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> AddProduct([FromBody] ProductDto dto)
    {
        try
        {
            var result = await productAdminService.CreateProductAsync(dto);
            return Created($"/api/products/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("products/{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductDto dto)
    {
        try
        {
            await productAdminService.UpdateProductAsync(id, dto);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("products/{id}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        try
        {
            await productAdminService.DeleteProductAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
