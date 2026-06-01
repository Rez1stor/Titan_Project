namespace Titan_Project.Server.Contracts.Users;

public class UserDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Country { get; set; }
    public string Role { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public int ReviewsCount { get; set; }
}
