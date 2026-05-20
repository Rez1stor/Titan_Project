using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Infrastructure.Catalog;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/wine-catalog")]
public class WineCatalogController : ControllerBase
{
    private readonly WineCatalogProvider catalogProvider;

    public WineCatalogController(WineCatalogProvider catalogProvider)
    {
        this.catalogProvider = catalogProvider;
    }

    [HttpGet("styles")]
    public IActionResult GetStyles()
        => Ok(catalogProvider.GetStyles());

    [HttpGet("colors")]
    public IActionResult GetColors()
        => Ok(catalogProvider.GetColors());

    [HttpGet("sweetness")]
    public IActionResult GetSweetness()
        => Ok(catalogProvider.GetSweetness());

    [HttpGet("aromas")]
    public IActionResult GetAromas()
        => Ok(catalogProvider.GetAromas());
}