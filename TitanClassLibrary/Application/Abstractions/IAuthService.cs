using Titan_Project.Server.Application.Auth;

namespace Titan_Project.Server.Application.Abstractions;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthUserDto?> GetCurrentAsync(CancellationToken ct);
}
