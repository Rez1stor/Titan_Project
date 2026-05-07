namespace Titan_Project.Server.Infrastructure.Catalog;

public sealed class BeerCatalog
{
    public List<BeerStyleFamilyEntry> Families { get; set; } = [];
}

public sealed class BeerStyleFamilyEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<BeerStyleEntry> Styles { get; set; } = [];
}

public sealed class BeerStyleEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}