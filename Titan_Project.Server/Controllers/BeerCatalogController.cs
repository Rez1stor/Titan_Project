using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Infrastructure.Catalog;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/beer-catalog")]
public class BeerCatalogController : ControllerBase
{
    private readonly BeerCatalogProvider catalogProvider;

    public BeerCatalogController(BeerCatalogProvider catalogProvider)
    {
        this.catalogProvider = catalogProvider;
    }

    [HttpGet("families")]
    public ActionResult<IReadOnlyList<BeerStyleFamilyEntry>> GetFamilies()
    {
        return Ok(catalogProvider.GetFamilies());
    }

    [HttpGet("families/{code}")]
    public ActionResult<BeerStyleFamilyEntry> GetFamily(string code)
    {
        var family = catalogProvider.GetFamily(code);
        return family is null ? NotFound() : Ok(family);
    }

    [HttpGet("styles/{code}")]
    public ActionResult<BeerStyleEntry> GetStyle(string code)
    {
        var style = catalogProvider.GetStyle(code);
        return style is null ? NotFound() : Ok(style);
    }
}