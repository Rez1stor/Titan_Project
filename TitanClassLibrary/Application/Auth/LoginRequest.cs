using System.ComponentModel.DataAnnotations;

namespace Titan_Project.Server.Application.Auth;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}
