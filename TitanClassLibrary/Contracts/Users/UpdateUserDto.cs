using System.ComponentModel.DataAnnotations;

namespace Titan_Project.Server.Contracts.Users;

public class UpdateUserDto
{
    [MinLength(3)]
    [MaxLength(50)]
    [RegularExpression("^[a-zA-Z0-9._-]+$")]
    public string? Username { get; set; }

    [EmailAddress]
    [MaxLength(254)]
    public string? Email { get; set; }

    [MinLength(8)]
    [MaxLength(128)]
    public string? Password { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }
}
