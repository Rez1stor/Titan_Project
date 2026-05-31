using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Infrastructure.Persistence;

public sealed class InMemoryUserRepository(AppDBContext db) : IUserRepository
{
    public Task<User?> FindByIdAsync(int userId, CancellationToken ct) =>
        db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);

    public Task<User?> FindByUsernameAsync(string username, CancellationToken ct) =>
        db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower(), ct);

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower(), ct);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower(), ct);

    public async Task<User> AddAsync(User user, CancellationToken ct)
    {
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            if (await db.Users.AnyAsync(u => u.UserId != user.UserId && u.Email.ToLower() == user.Email.ToLower(), ct))
                throw new DuplicateUserException(DuplicateUserField.Email);
            throw new DuplicateUserException(DuplicateUserField.Username);
        }
        return user;
    }
}
