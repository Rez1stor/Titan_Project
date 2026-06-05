using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TitanClassLibrary.Application.Catalog;
using TitanClassLibrary.Contracts.Catalog;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/admin/catalog-beer")]
[Authorize(Roles = Titan_Project.Server.Application.Security.Roles.Admin + "," + Titan_Project.Server.Application.Security.Roles.Moderator)]
public class AdminCatalogBeerController(IAdminCatalogBeerService catalogBeerService) : ControllerBase
{
    [HttpGet("suggest")]
    public async Task<ActionResult<IReadOnlyList<CatalogBeerSuggestionDto>>> Suggest([FromQuery] string? q = null, [FromQuery] int count = 8)
    {
        try
        {
            var suggestions = await catalogBeerService.SuggestAsync(q, count);
            return Ok(suggestions);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("details/{beerId}")]
    public async Task<ActionResult<CatalogBeerAutofillResponse>> Details(string beerId)
    {
        try
        {
            var details = await catalogBeerService.GetDetailsAsync(beerId);
            return Ok(details);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record CatalogBeerSuggestionDto(
    string Id,
    string Name,
    string? Style,
    double? Abv,
    decimal? Ibu,
    string? BrewerName,
    bool? CbVerified,
    string Source,
    int FilledFields
);

public record CatalogBeerAutofillResponse(
    CatalogBeerAutofillProductDto Product,
    IReadOnlyList<string> MissingFields
);

public class CatalogBeerAutofillProductDto
{
    public string? Name { get; set; }
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public double? StrengthAbv { get; set; }
    public string? Country { get; set; }
    public string? BeerStyle { get; set; }
    public string? BeerColor { get; set; }
    public decimal? BeerIbu { get; set; }
    public decimal? BeerSrm { get; set; }
    public string? ImageUrl { get; set; }
}

public class CatalogBeerListResponse
{
    public List<CatalogBeerApiDto>? Data { get; set; }
}

public class CatalogBeerApiDto
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Style { get; set; }
    public string? Description { get; set; }
    public double? Abv { get; set; }
    public decimal? Ibu { get; set; }
    public bool? CbVerified { get; set; }
    public CatalogBeerBrewerDto? Brewer { get; set; }
}

public class CatalogBeerBrewerDto
{
    public string? Name { get; set; }
}
