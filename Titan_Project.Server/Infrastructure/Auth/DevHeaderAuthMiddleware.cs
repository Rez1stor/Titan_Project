using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Http;

namespace Titan_Project.Server.Infrastructure.Auth;

public class DevHeaderAuthMiddleware
{
    private readonly RequestDelegate _next;

    public DevHeaderAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only active in Development environment (registered conditionally)
        if (context.Request.Headers.TryGetValue("X-User-Id", out var idValue))
        {
            if (int.TryParse(idValue.FirstOrDefault(), out var userId))
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Name, $"dev-user-{userId}")
                };

                var identity = new ClaimsIdentity(claims, "DevHeader");
                context.User = new ClaimsPrincipal(identity);
            }
        }

        await _next(context);
    }
}
