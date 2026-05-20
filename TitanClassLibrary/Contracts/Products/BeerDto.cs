namespace Titan_Project.Server.Contracts.Products;

public class BeerDto : ProductDto
{
    public string StyleFamily { get; set; } = string.Empty;
    public string Style { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}