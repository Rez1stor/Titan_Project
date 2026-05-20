using System.Text.Json.Serialization; 

namespace Titan_Project.Server.Infrastructure.Catalog;

public sealed class WineCatalog
{
    public List<WineStyleEntry> Styles { get; set; } = [];
    public List<WineColorEntry> Colors { get; set; } = [];
    public List<WineSweetnessEntry> Sweetness { get; set; } = [];
    public List<WineAromaEntry> Aromas { get; set; } = [];
}

public sealed class WineStyleEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public sealed class WineColorEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public sealed class WineSweetnessEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public sealed class WineAromaEntry
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}