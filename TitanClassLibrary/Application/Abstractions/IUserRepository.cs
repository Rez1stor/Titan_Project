using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Application.Abstractions;

public interface IUserRepository
{
    Task<User?> FindByIdAsync(int userId, CancellationToken ct);
    Task<User?> FindByUsernameAsync(string username, CancellationToken ct);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct);
    Task<User> AddAsync(User user, CancellationToken ct);
}
