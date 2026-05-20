using System.ComponentModel.DataAnnotations;

namespace Titan_Project.Server.Domain.Model;

public class User
{
    [Key]
    public int UserId { get; set; }
    [Required]
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    [Required]
    public string PasswordHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Country { get; set; }
    public virtual ICollection<AlcoholProduct> Favorites { get; set; } = new List<AlcoholProduct>();
    public decimal? TargetAbv { get; set; }
    public decimal? AbvTolerance { get; set; }
    public decimal? MaxPrice { get; set; }
    public string PreferredTagsJson { get; set; } = "[]";

}