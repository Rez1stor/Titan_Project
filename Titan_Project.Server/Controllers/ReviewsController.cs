using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Reviews;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    [HttpGet("product/{productId}")]
    public ActionResult<IEnumerable<ReviewDto>> GetReviewsForProduct(Guid productId)
    {
        var reviews = SeedData.Reviews.Where(r => r.ProductId == productId).ToList();
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
            Id = Guid.NewGuid(),
            ProductId = reviewDto.ProductId,
            Username = "CurrentUser", // Поки немає авторизації
            Rating = reviewDto.Rating,
            Comment = reviewDto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        SeedData.Reviews.Add(newReview);

        // Повертаємо створений об'єкт та статус 201 Created
        return CreatedAtAction(nameof(GetReviewsForProduct), new { productId = newReview.ProductId }, newReview);
    }
}
