using System.ComponentModel.DataAnnotations;

namespace Titan_Project.Server.Application.Auth;

public class RegisterRequest
{
    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    [RegularExpression("^[a-zA-Z0-9._-]+$")]
    public string Username { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string Password { get; set; } = null!;

    [MaxLength(100)]
    public string? Country { get; set; }

    public Titan_Project.Server.Contracts.Users.UserPreferencesDto? Preferences { get; set; }
}
