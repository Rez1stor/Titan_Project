namespace Titan_Project.Server.Contracts.Users;

public class UserPreferencesDto
{
    public decimal? TargetAbv { get; set; }
    public decimal? AbvTolerance { get; set; }
    public decimal? MaxPrice { get; set; }
    public string[] PreferredTags { get; set; } = new string[0];
}
