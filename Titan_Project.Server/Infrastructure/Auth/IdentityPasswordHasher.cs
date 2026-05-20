using Microsoft.AspNetCore.Identity;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Infrastructure.Auth;

public sealed class IdentityPasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(null!, password);

    public bool Verify(string hash, string password)
    {
        var result = _hasher.VerifyHashedPassword(null!, hash, password);
        return result is PasswordVerificationResult.Success
                       or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
