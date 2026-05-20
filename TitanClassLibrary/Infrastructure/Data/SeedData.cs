using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Contracts.Reviews;
using System.Collections.Concurrent;

namespace Titan_Project.Server.Infrastructure.Data;

public static class SeedData
{
	public static readonly int P1 = 1;
		public static readonly int P2 = 2;
		public static readonly int P3 = 3;

		public static readonly List<ProductDto> Products = new()
		{
			new ProductDto { Id = P1, Name = "Guinness Draught", CategoryName = "Beer", StrengthAbv = 4.2, Country = "Ireland", BasePrice = 3.5m, Description = "Iconic Irish stout.", AvgRating = 4.7, ReviewsCount = 1250 },
			new ProductDto { Id = P2, Name = "Corona Extra", CategoryName = "Beer", StrengthAbv = 4.5, Country = "Mexico", BasePrice = 2.0m, Description = "Refreshing lager.", AvgRating = 4.1, ReviewsCount = 850 },
			new ProductDto { Id = P3, Name = "Cabernet Sauvignon", CategoryName = "Wine", StrengthAbv = 13.5, Country = "France", BasePrice = 15.0m, Description = "Full-bodied red wine.", AvgRating = 4.6, ReviewsCount = 320 }
		};

		public static readonly List<ReviewDto> Reviews = new()
		{
			new ReviewDto { Id = 1, ProductId = P1, Username = "BeerLover99", Rating = 5, Comment = "Classic taste.", CreatedAt = DateTime.UtcNow.AddDays(-2) },
			new ReviewDto { Id = 2, ProductId = P1, Username = "Ivan", Rating = 4, Comment = "A bit heavy.", CreatedAt = DateTime.UtcNow.AddDays(-5) }
		};

		// Simple in-memory favorites per user (keyed by user-id header string)
		public static readonly ConcurrentDictionary<string, List<int>> Favorites = new();
}
