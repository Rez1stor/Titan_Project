namespace Titan_Project.Server.Domain.Entities;

public class UserFavorite
{
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}