using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Models.DTOs;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private static readonly List<ReviewDto> _mockReviews = new()
    {
        new ReviewDto { Id = 1, ProductId = 1, Username = "BeerLover99", Rating = 5, Comment = "Classic taste, always good.", CreatedAt = DateTime.UtcNow.AddDays(-2) },
        new ReviewDto { Id = 2, ProductId = 1, Username = "Ivan", Rating = 4, Comment = "A bit too heavy for my taste.", CreatedAt = DateTime.UtcNow.AddDays(-5) }
    };

    [HttpGet("product/{productId}")]
    public ActionResult<IEnumerable<ReviewDto>> GetReviewsForProduct(int productId)
    {
        var reviews = _mockReviews.Where(r => r.ProductId == productId).ToList();
        return Ok(reviews);
    }

    [HttpPost]
    public ActionResult<ReviewDto> CreateReview([FromBody] CreateReviewDto reviewDto)
    {
        // Базова валідація
        if (reviewDto.Rating < 1 || reviewDto.Rating > 5)
        {
            return BadRequest("Rating must be between 1 and 5.");
        }

        // Імітуємо збереження
        var newReview = new ReviewDto
        {
            Id = _mockReviews.Max(r => r.Id) + 1,
            ProductId = reviewDto.ProductId,
            Username = "CurrentUser", // Поки немає авторизації
            Rating = reviewDto.Rating,
            Comment = reviewDto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _mockReviews.Add(newReview);

        // Повертаємо створений об'єкт та статуc 201 Created
        return CreatedAtAction(nameof(GetReviewsForProduct), new { productId = newReview.ProductId }, newReview);
    }
}
