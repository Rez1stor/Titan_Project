using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthUserDto>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await auth.RegisterAsync(request, ct);
        if (!result.IsSuccess)
            return Conflict(new { error = result.Error.ToString() });

        await SignInUserAsync(result.User!);
        return CreatedAtAction(nameof(Me), ToDto(result.User!));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthUserDto>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        if (!result.IsSuccess)
            return Unauthorized(new { error = result.Error.ToString() });

        await SignInUserAsync(result.User!);
        return Ok(ToDto(result.User!));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken ct)
    {
        var current = await auth.GetCurrentAsync(ct);
        if (current is null)
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }
        return Ok(current);
    }

    private async Task SignInUserAsync(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? Titan_Project.Server.Application.Security.Roles.User),
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
    }

    private static AuthUserDto ToDto(User user) => new()
    {
        UserId = user.UserId,
        Username = user.Username,
        Email = user.Email,
        Country = user.Country,
        Role = user.Role,
    };
}
