using System;
using Titan_Project.Server.Domain.Enums;

namespace Titan_Project.Server.Contracts.Products;

public class ProductDto
{
	public int Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string CategoryName { get; set; } = string.Empty;
	public double? StrengthAbv { get; set; }
	public string? Country { get; set; }
	public decimal? BasePrice { get; set; }
	public string? Description { get; set; }
	public double AvgRating { get; set; }
	public int ReviewsCount { get; set; }
	public decimal? BeerIbu { get; set; }
	public decimal? BeerSrm { get; set; }
	public string? BeerColor { get; set; }
	public string? BeerStyle { get; set; }
	public string? WineColor { get; set; }
	public string? WineStyle { get; set; }
	public string? WineSweetness { get; set; }
	public List<string> WineAromas { get; set; } = new();
	public string? ImageUrl { get; set; }
	public string? ImageSourceUrl { get; set; }
	public string? ImageLocalPath { get; set; }

	// Keep numeric enum values for backward compatibility if any client depends on them
	public int? BeerColorValue { get; set; }
	public int? BeerStyleValue { get; set; }
	public int? WineColorValue { get; set; }
	public int? WineStyleValue { get; set; }
	
}
