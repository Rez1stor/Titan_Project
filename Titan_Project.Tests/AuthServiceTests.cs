using Xunit;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_ReturnsUsernameTaken_WhenUsernameExists()
    {
        var users = new FakeUserRepository { UsernameExists = true };
        var service = new AuthService(users, new FakePasswordHasher(), new FakeCurrentUser());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Username = "taken",
            Email = "new@test.local",
            Password = "password1",
        }, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(AuthError.UsernameTaken, result.Error);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsEmailTaken_WhenEmailExists()
    {
        var users = new FakeUserRepository { EmailExists = true };
        var service = new AuthService(users, new FakePasswordHasher(), new FakeCurrentUser());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Username = "newuser",
            Email = "taken@test.local",
            Password = "password1",
        }, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(AuthError.EmailTaken, result.Error);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsSuccess_AndHashesPassword()
    {
        var users = new FakeUserRepository();
        var hasher = new FakePasswordHasher();
        var service = new AuthService(users, hasher, new FakeCurrentUser());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Username = "alice",
            Email = "alice@test.local",
            Password = "secret123",
            Country = "PL",
        }, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.User);
        Assert.Equal("alice", result.User!.Username);
        Assert.Equal("hashed:secret123", result.User.PasswordHash);
        Assert.Equal(Titan_Project.Server.Application.Security.Roles.User, result.User.Role);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenUserMissing()
    {
        var service = new AuthService(new FakeUserRepository(), new FakePasswordHasher(), new FakeCurrentUser());

        var result = await service.LoginAsync(new LoginRequest
        {
            Username = "ghost",
            Password = "password1",
        }, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(AuthError.InvalidCredentials, result.Error);
    }

    [Fact]
    public async Task LoginAsync_ReturnsInvalidCredentials_WhenPasswordWrong()
    {
        var users = new FakeUserRepository();
        users.Seed(new User
        {
            UserId = 1,
            Username = "bob",
            Email = "bob@test.local",
            PasswordHash = "hashed:correct",
        });

        var service = new AuthService(users, new FakePasswordHasher(), new FakeCurrentUser());

        var result = await service.LoginAsync(new LoginRequest
        {
            Username = "bob",
            Password = "wrong",
        }, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(AuthError.InvalidCredentials, result.Error);
    }

    [Fact]
    public async Task LoginAsync_ReturnsSuccess_WhenCredentialsValid()
    {
        var users = new FakeUserRepository();
        users.Seed(new User
        {
            UserId = 1,
            Username = "bob",
            Email = "bob@test.local",
            PasswordHash = "hashed:correct",
        });

        var service = new AuthService(users, new FakePasswordHasher(), new FakeCurrentUser());

        var result = await service.LoginAsync(new LoginRequest
        {
            Username = "bob",
            Password = "correct",
        }, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("bob", result.User!.Username);
    }

    [Fact]
    public async Task GetCurrentAsync_ReturnsNull_WhenNotAuthenticated()
    {
        var service = new AuthService(new FakeUserRepository(), new FakePasswordHasher(), new FakeCurrentUser());

        var current = await service.GetCurrentAsync(CancellationToken.None);

        Assert.Null(current);
    }

    [Fact]
    public async Task GetCurrentAsync_ReturnsUser_WhenAuthenticated()
    {
        var users = new FakeUserRepository();
        users.Seed(new User
        {
            UserId = 42,
            Username = "carol",
            Email = "carol@test.local",
            PasswordHash = "hash",
            Country = "UA",
            Role = Titan_Project.Server.Application.Security.Roles.User,
        });

        var service = new AuthService(users, new FakePasswordHasher(), new FakeCurrentUser { UserId = 42 });

        var current = await service.GetCurrentAsync(CancellationToken.None);

        Assert.NotNull(current);
        Assert.Equal(42, current!.UserId);
        Assert.Equal("carol", current.Username);
        Assert.Equal("UA", current.Country);
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        private readonly Dictionary<int, User> _users = new();
        private int _nextId = 1;

        public bool UsernameExists { get; set; }
        public bool EmailExists { get; set; }

        public void Seed(User user) => _users[user.UserId] = user;

        public Task<User?> FindByIdAsync(int userId, CancellationToken ct) =>
            Task.FromResult(_users.TryGetValue(userId, out var user) ? user : null);

        public Task<User?> FindByUsernameAsync(string username, CancellationToken ct) =>
            Task.FromResult(_users.Values.FirstOrDefault(u =>
                string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase)));

        public Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct) =>
            Task.FromResult(UsernameExists);

        public Task<bool> ExistsByUsernameAsync(string username, int excludeUserId, CancellationToken ct) =>
            Task.FromResult(UsernameExists);

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken ct) =>
            Task.FromResult(EmailExists);

        public Task<bool> ExistsByEmailAsync(string email, int excludeUserId, CancellationToken ct) =>
            Task.FromResult(EmailExists);

        public Task<User> AddAsync(User user, CancellationToken ct)
        {
            user.UserId = _nextId++;
            _users[user.UserId] = user;
            return Task.FromResult(user);
        }

        public Task<User?> UpdateAsync(User user, CancellationToken ct)
        {
            _users[user.UserId] = user;
            return Task.FromResult<User?>(user);
        }

        public Task<bool> DeleteAsync(int userId, CancellationToken ct)
        {
            var result = _users.Remove(userId);
            return Task.FromResult(result);
        }

        public Task<(IReadOnlyList<User> Items, int TotalCount)> ListAsync(int page, int pageSize, CancellationToken ct)
        {
            var items = _users.Values.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return Task.FromResult(((IReadOnlyList<User>)items, _users.Count));
        }
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public string Hash(string password) => $"hashed:{password}";

        public bool Verify(string hash, string password) => hash == Hash(password);
    }

    private sealed class FakeCurrentUser : ICurrentUserContext
    {
        public int? UserId { get; set; }
        public string? Username => null;
        public bool IsAuthenticated => UserId.HasValue;
    }
}
