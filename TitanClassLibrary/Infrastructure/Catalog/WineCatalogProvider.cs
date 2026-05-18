using System.Text.Json;
using Microsoft.Extensions.Hosting;

namespace Titan_Project.Server.Infrastructure.Catalog;
public sealed class WineCatalogProvider
{
    private readonly Lazy<WineCatalog> catalog;

    public WineCatalogProvider(IHostEnvironment environment)
    {
        var path = Path.Combine(environment.ContentRootPath, "wine-catalog.json");
        catalog = new Lazy<WineCatalog>(() => Load(path));
    }

    public IReadOnlyList<WineStyleEntry> GetStyles()
        => catalog.Value.Styles;

    public IReadOnlyList<WineColorEntry> GetColors()
        => catalog.Value.Colors;

    public IReadOnlyList<WineSweetnessEntry> GetSweetness()
        => catalog.Value.Sweetness;

    public IReadOnlyList<WineAromaEntry> GetAromas()
        => catalog.Value.Aromas;

    private static WineCatalog Load(string path)
    {
        if (!File.Exists(path))
            return new WineCatalog();

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<WineCatalog>(json) ?? new WineCatalog();
    }
}