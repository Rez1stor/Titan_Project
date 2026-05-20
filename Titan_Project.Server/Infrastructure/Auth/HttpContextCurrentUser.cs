using System.Security.Claims;
using Titan_Project.Server.Application.Abstractions;

namespace Titan_Project.Server.Infrastructure.Auth;

public sealed class HttpContextCurrentUser(IHttpContextAccessor http) : ICurrentUserContext
{
    public int? UserId
    {
        get
        {
            var value = http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username => http.HttpContext?.User.FindFirstValue(ClaimTypes.Name);

    public bool IsAuthenticated => http.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
