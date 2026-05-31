using Titan_Project.Server.Domain.Enums;

namespace Titan_Project.Server.Contracts.Seeding;

public sealed class AlcoholSeedRequestDto
{
    public List<AlcoholSeedItemDto> Products { get; init; } = new();
    public string? OutputFileName { get; init; }
}

public sealed class AlcoholSeedItemDto
{
    public int ProductId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Abv { get; init; }
    public decimal Price { get; init; }
    public string CountryOfOrigin { get; init; } = string.Empty;

    public decimal? BeerIbu { get; init; }
    public decimal? BeerSrm { get; init; }
    public BeerColor? BeerColor { get; init; }
    public BeerStyle? BeerStyle { get; init; }

    public WineColor? WineColor { get; init; }
    public WineStyle? WineStyle { get; init; }
    public WineSweetness? WineSweetness { get; init; }
    public List<WineAroma> WineAromas { get; init; } = new();
}

public sealed class AlcoholSeedResultDto
{
    public DateTime GeneratedAtUtc { get; init; }
    public string OutputFilePath { get; init; } = string.Empty;
    public string ImageDirectory { get; init; } = string.Empty;
    public List<AlcoholSeedExportItemDto> Items { get; init; } = new();
}

public sealed class AlcoholSeedExportItemDto
{
    public int ProductId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string CategoryName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal Abv { get; init; }
    public decimal Price { get; init; }
    public string CountryOfOrigin { get; init; } = string.Empty;

    public decimal? BeerIbu { get; init; }
    public decimal? BeerSrm { get; init; }
    public BeerColor? BeerColor { get; init; }
    public BeerStyle? BeerStyle { get; init; }

    public WineColor? WineColor { get; init; }
    public WineStyle? WineStyle { get; init; }
    public WineSweetness? WineSweetness { get; init; }
    public List<WineAroma> WineAromas { get; init; } = new();

    public string? OpenFoodFactsCode { get; init; }
    public string? MatchedProductName { get; init; }
    public string? SourceImageUrl { get; init; }
    public string? LocalImagePath { get; init; }
}

public sealed class AlcoholImageCandidateDto
{
    public string? Code { get; init; }
    public string? ProductName { get; init; }
    public string? Brands { get; init; }
    public string? ImageUrl { get; init; }
    public string? ImageFrontUrl { get; init; }
    public string? ImageFrontThumbUrl { get; init; }
    public int Score { get; init; }
}