namespace Titan_Project.Server.Infrastructure.Catalog;

public sealed class BeerCatalog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<BeerStyleFamilyEntry> Families { get; set; } = [];
    public List<BeerColorEntry> Colors { get; set; } = [];
}

public sealed class BeerStyleFamilyEntry
{
    public int BeerStyleFamilyEntryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<BeerStyleEntry> Styles { get; set; } = [];
}

public sealed class BeerStyleEntry
{
    public int BeerStyleEntryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public sealed class BeerColorEntry
{
    public int BeerColorEntryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}