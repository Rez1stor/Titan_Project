using Titan_Project.Server.Contracts.Products;
using Titan_Project.Server.Contracts.Reviews;
using System.Collections.Concurrent;

namespace Titan_Project.Server.Infrastructure.Data;

public static class SeedData
{
	public static readonly Guid P1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
		public static readonly Guid P2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
		public static readonly Guid P3 = Guid.Parse("33333333-3333-3333-3333-333333333333");

		public static readonly List<ProductDto> Products = new()
		{
			new ProductDto { Id = P1, Name = "Guinness Draught", CategoryName = "Beer", StrengthAbv = 4.2, Country = "Ireland", BasePrice = 3.5m, Description = "Iconic Irish stout.", AvgRating = 4.7, ReviewsCount = 1250 },
			new ProductDto { Id = P2, Name = "Corona Extra", CategoryName = "Beer", StrengthAbv = 4.5, Country = "Mexico", BasePrice = 2.0m, Description = "Refreshing lager.", AvgRating = 4.1, ReviewsCount = 850 },
			new ProductDto { Id = P3, Name = "Cabernet Sauvignon", CategoryName = "Wine", StrengthAbv = 13.5, Country = "France", BasePrice = 15.0m, Description = "Full-bodied red wine.", AvgRating = 4.6, ReviewsCount = 320 }
		};

		public static readonly List<ReviewDto> Reviews = new()
		{
			new ReviewDto { Id = Guid.NewGuid(), ProductId = P1, Username = "BeerLover99", Rating = 5, Comment = "Classic taste.", CreatedAt = DateTime.UtcNow.AddDays(-2) },
			new ReviewDto { Id = Guid.NewGuid(), ProductId = P1, Username = "Ivan", Rating = 4, Comment = "A bit heavy.", CreatedAt = DateTime.UtcNow.AddDays(-5) }
		};

		// Simple in-memory favorites per user (keyed by user-id header string)
		public static readonly ConcurrentDictionary<string, List<Guid>> Favorites = new();
}
