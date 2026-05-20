using System.Text.Json;
using Microsoft.Extensions.Hosting;

namespace Titan_Project.Server.Infrastructure.Catalog;

public sealed class BeerCatalogProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly Lazy<BeerCatalog> catalog;

    public BeerCatalogProvider(IHostEnvironment environment)
    {
        var path = Path.Combine(environment.ContentRootPath, "beer-catalog.json");
        catalog = new Lazy<BeerCatalog>(() => Load(path));
    }

    public IReadOnlyList<BeerStyleFamilyEntry> GetFamilies() => catalog.Value.Families;
    public IReadOnlyList<BeerColorEntry> GetColors() => catalog.Value.Colors;

    public BeerStyleFamilyEntry? GetFamily(string code) =>
        catalog.Value.Families.FirstOrDefault(f => string.Equals(f.Code, code, StringComparison.OrdinalIgnoreCase));

    public BeerStyleEntry? GetStyle(string code) =>
        catalog.Value.Families
            .SelectMany(f => f.Styles)
            .FirstOrDefault(s => string.Equals(s.Code, code, StringComparison.OrdinalIgnoreCase));

    public BeerColorEntry? GetColor(string code) =>
        catalog.Value.Colors.FirstOrDefault(c => string.Equals(c.Code, code, StringComparison.OrdinalIgnoreCase));
    public IReadOnlyList<BeerStyleEntry> GetStylesByFamily(string familyCode) =>
        GetFamily(familyCode)?.Styles ?? [];
    
    

    private static BeerCatalog Load(string path)
    {
        if (!File.Exists(path))
        {
            return new BeerCatalog();
        }

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<BeerCatalog>(json, JsonOptions) ?? new BeerCatalog();
    }
}