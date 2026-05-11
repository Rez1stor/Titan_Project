namespace Titan_Project.Server.Domain.Entities;

public class UserPreference
{
    public Guid UserId { get; set; }

    public decimal? TargetAbv { get; set; }
    public decimal? AbvTolerance { get; set; }
    public decimal? MaxPrice { get; set; }
    public string PreferredTagsJson { get; set; } = "[]";
}