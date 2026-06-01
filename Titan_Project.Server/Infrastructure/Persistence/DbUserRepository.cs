using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Infrastructure.Persistence;

public sealed class DbUserRepository(AppDBContext db) : IUserRepository
{
    public Task<User?> FindByIdAsync(int userId, CancellationToken ct) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId, ct);

    public Task<User?> FindByUsernameAsync(string username, CancellationToken ct) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username, ct);

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Username == username, ct);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Email == email, ct);

    public Task<bool> ExistsByUsernameAsync(string username, int excludeUserId, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Username == username && u.UserId != excludeUserId, ct);

    public Task<bool> ExistsByEmailAsync(string email, int excludeUserId, CancellationToken ct) =>
        db.Users.AnyAsync(u => u.Email == email && u.UserId != excludeUserId, ct);

    public async Task<User> AddAsync(User user, CancellationToken ct)
    {
        if (await ExistsByUsernameAsync(user.Username, ct))
            throw new DuplicateUserException(DuplicateUserField.Username);

        if (await ExistsByEmailAsync(user.Email, ct))
            throw new DuplicateUserException(DuplicateUserField.Email);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user;
    }

    public async Task<User?> UpdateAsync(User user, CancellationToken ct)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.UserId == user.UserId, ct);
        if (existing is null)
            return null;

        if (await ExistsByUsernameAsync(user.Username, user.UserId, ct))
            throw new DuplicateUserException(DuplicateUserField.Username);

        if (await ExistsByEmailAsync(user.Email, user.UserId, ct))
            throw new DuplicateUserException(DuplicateUserField.Email);

        existing.Username = user.Username;
        existing.Email = user.Email;
        existing.PasswordHash = user.PasswordHash;
        existing.Country = user.Country;
        existing.Role = user.Role;

        await db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task<bool> DeleteAsync(int userId, CancellationToken ct)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
        if (existing is null)
            return false;

        db.Users.Remove(existing);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<(IReadOnlyList<User> Items, int TotalCount)> ListAsync(int page, int pageSize, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking().OrderBy(u => u.UserId);
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
