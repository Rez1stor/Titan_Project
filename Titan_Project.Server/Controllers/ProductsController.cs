using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Application.Products;
using Titan_Project.Server.Contracts.Common;
using Titan_Project.Server.Contracts.Products;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductQueryService products) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? country,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? priceBand,
        [FromQuery] string? beerStyle,
        [FromQuery] string? beerColor,
        [FromQuery] decimal? maxIbu,
        [FromQuery] decimal? maxSrm,
        [FromQuery] string? wineStyle,
        [FromQuery] string? wineColor,
        [FromQuery] string? wineSweetness,
        [FromQuery] string? sortBy = "name",
        [FromQuery] string? sortDir = "asc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await products.SearchAsync(new ProductQueryOptions
        {
            Category = category,
            Search = search,
            Country = country,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            PriceBand = priceBand,
            BeerStyle = beerStyle,
            BeerColor = beerColor,
            MaxIbu = maxIbu,
            MaxSrm = maxSrm,
            WineStyle = wineStyle,
            WineColor = wineColor,
            WineSweetness = wineSweetness,
            SortBy = sortBy ?? "name",
            SortDir = sortDir ?? "asc",
            Page = page,
            PageSize = pageSize,
        }, ct);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(id, ct);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("by-name/{name}")]
    public async Task<ActionResult<ProductDto>> GetProductByName(string name, CancellationToken ct)
    {
        var product = await products.GetByNameAsync(name, ct);
        return product is null ? NotFound() : Ok(product);
    }
}
