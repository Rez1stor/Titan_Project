using System.Collections.Generic;

namespace TitanClassLibrary.Contracts.Catalog;

public record CatalogBeerSuggestionDto(
    string Id,
    string Name,
    string? Style,
    double? Abv,
    decimal? Ibu,
    string? BrewerName,
    bool? CbVerified,
    string Source,
    int FilledFields
);

public record CatalogBeerAutofillResponse(
    CatalogBeerAutofillProductDto Product,
    IReadOnlyList<string> MissingFields
);

public class CatalogBeerAutofillProductDto
{
    public string? Name { get; set; }
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public double? StrengthAbv { get; set; }
    public string? Country { get; set; }
    public string? BeerStyle { get; set; }
    public string? BeerColor { get; set; }
    public decimal? BeerIbu { get; set; }
    public decimal? BeerSrm { get; set; }
    public string? ImageUrl { get; set; }
}

public class CatalogBeerListResponse
{
    public List<CatalogBeerApiDto>? Data { get; set; }
}

public class CatalogBeerApiDto
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Style { get; set; }
    public string? Description { get; set; }
    public double? Abv { get; set; }
    public decimal? Ibu { get; set; }
    public bool? CbVerified { get; set; }
    public CatalogBeerBrewerDto? Brewer { get; set; }
}

public class CatalogBeerBrewerDto
{
    public string? Name { get; set; }
}
