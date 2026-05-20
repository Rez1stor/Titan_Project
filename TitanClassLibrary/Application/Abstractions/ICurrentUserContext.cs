namespace Titan_Project.Server.Application.Abstractions;

public interface ICurrentUserContext
{
    int? UserId { get; }
    string? Username { get; }
    bool IsAuthenticated { get; }
}
