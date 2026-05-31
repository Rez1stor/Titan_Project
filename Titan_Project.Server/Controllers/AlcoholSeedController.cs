using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Seeding;
using Titan_Project.Server.Infrastructure.Seeding;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/dev/alcohol-seed")]
[AllowAnonymous]
public sealed class AlcoholSeedController(IAlcoholSeedService seedService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<AlcoholSeedResultDto>> Generate([FromBody] AlcoholSeedRequestDto request, CancellationToken cancellationToken)
    {
        if (request.Products.Count == 0)
        {
            return BadRequest("At least one alcohol product must be provided.");
        }

        var result = await seedService.GenerateAsync(request.Products, request.OutputFileName, cancellationToken);
        return Ok(result);
    }
}