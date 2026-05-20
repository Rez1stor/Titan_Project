namespace Titan_Project.Server.Application.Auth;

public class AuthUserDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Country { get; set; }
}
