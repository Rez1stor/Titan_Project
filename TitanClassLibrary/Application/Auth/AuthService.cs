using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Application.Auth;

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher hasher,
    ICurrentUserContext currentUser) : IAuthService
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        if (await users.ExistsByUsernameAsync(request.Username, ct))
            return AuthResult.Failure(AuthError.UsernameTaken);

        if (await users.ExistsByEmailAsync(request.Email, ct))
            return AuthResult.Failure(AuthError.EmailTaken);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hasher.Hash(request.Password),
            Country = request.Country,
            Role = Titan_Project.Server.Application.Security.Roles.User,
        };

        try
        {
            var saved = await users.AddAsync(user, ct);
            return AuthResult.Success(saved);
        }
        catch (DuplicateUserException ex)
        {
            return AuthResult.Failure(
                ex.Field == DuplicateUserField.Username
                    ? AuthError.UsernameTaken
                    : AuthError.EmailTaken);
        }
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await users.FindByUsernameAsync(request.Username, ct);
        if (user is null)
            return AuthResult.Failure(AuthError.InvalidCredentials);

        if (!hasher.Verify(user.PasswordHash, request.Password))
            return AuthResult.Failure(AuthError.InvalidCredentials);

        return AuthResult.Success(user);
    }

    public async Task<AuthUserDto?> GetCurrentAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not int id)
            return null;

        var user = await users.FindByIdAsync(id, ct);
        if (user is null)
            return null;

        return new AuthUserDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            Country = user.Country,
            Role = user.Role,
        };
    }
}
