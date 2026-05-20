using System.Collections.Concurrent;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Infrastructure.Persistence;

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<int, User> _byId = new();
    private readonly ConcurrentDictionary<string, int> _byUsername = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, int> _byEmail = new(StringComparer.OrdinalIgnoreCase);
    private int _nextId;

    public Task<User?> FindByIdAsync(int userId, CancellationToken ct)
    {
        _byId.TryGetValue(userId, out var user);
        return Task.FromResult<User?>(user);
    }

    public Task<User?> FindByUsernameAsync(string username, CancellationToken ct)
    {
        if (_byUsername.TryGetValue(username, out var id) && _byId.TryGetValue(id, out var user))
            return Task.FromResult<User?>(user);
        return Task.FromResult<User?>(null);
    }

    public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct) =>
        Task.FromResult(_byUsername.ContainsKey(username));

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct) =>
        Task.FromResult(_byEmail.ContainsKey(email));

    public Task<User> AddAsync(User user, CancellationToken ct)
    {
        var id = Interlocked.Increment(ref _nextId);
        user.UserId = id;

        if (!_byUsername.TryAdd(user.Username, id))
            throw new DuplicateUserException(DuplicateUserField.Username);

        if (!_byEmail.TryAdd(user.Email, id))
        {
            _byUsername.TryRemove(user.Username, out _);
            throw new DuplicateUserException(DuplicateUserField.Email);
        }

        _byId[id] = user;
        return Task.FromResult(user);
    }
}
