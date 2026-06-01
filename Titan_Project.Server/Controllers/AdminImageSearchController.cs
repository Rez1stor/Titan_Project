using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Infrastructure.Seeding;
using Titan_Project.Server.Contracts.Seeding;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/admin/image-search")]
[Authorize]
public sealed class AdminImageSearchController : ControllerBase
{
    private readonly IAlcoholSeedService _seedService;

    public AdminImageSearchController(IAlcoholSeedService seedService)
    {
        _seedService = seedService ?? throw new ArgumentNullException(nameof(seedService));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AlcoholImageCandidateDto>>> Search([FromQuery] string name, [FromQuery] string type, [FromQuery] string? styleOrDetail)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(type))
            return BadRequest("name and type are required");

        var candidates = await _seedService.FindCandidatesAsync(name, type, styleOrDetail, CancellationToken.None);

        return Ok(candidates);
    }
}
