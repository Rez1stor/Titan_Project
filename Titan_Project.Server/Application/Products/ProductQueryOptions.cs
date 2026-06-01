namespace Titan_Project.Server.Application.Products;

public sealed class ProductQueryOptions
{
    public string? Category { get; init; }
    public string? Search { get; init; }
    public string? Country { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string? PriceBand { get; init; }
    public string? BeerStyle { get; init; }
    public string? BeerColor { get; init; }
    public decimal? MaxIbu { get; init; }
    public decimal? MaxSrm { get; init; }
    public string? WineStyle { get; init; }
    public string? WineColor { get; init; }
    public string? WineSweetness { get; init; }
    public string SortBy { get; init; } = "name";
    public string SortDir { get; init; } = "asc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
