using System;

namespace Titan_Project.Server.Contracts.Recommendations;

public class RecommendedProductDto
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
}

