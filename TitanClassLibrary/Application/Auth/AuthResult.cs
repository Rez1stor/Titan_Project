using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Application.Auth;

public sealed class AuthResult
{
    public bool IsSuccess { get; }
    public User? User { get; }
    public AuthError? Error { get; }

    private AuthResult(bool success, User? user, AuthError? error)
    {
        IsSuccess = success;
        User = user;
        Error = error;
    }

    public static AuthResult Success(User user) => new(true, user, null);
    public static AuthResult Failure(AuthError error) => new(false, null, error);
}
