using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Contracts.Reviews;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    [HttpGet("product/{productId}")]
    public ActionResult<IEnumerable<ReviewDto>> GetReviewsForProduct(int productId)
    {
        var reviews = SeedData.Reviews.Where(r => r.ProductId == productId).ToList();
        return Ok(reviews);
    }

    [HttpPost]
    public ActionResult<ReviewDto> CreateReview([FromBody] CreateReviewDto reviewDto)
    {
        var newReview = new ReviewDto
        {
            Id = SeedData.Reviews.Count + 1,
            ProductId = reviewDto.ProductId,
            Username = "CurrentUser",
            Rating = reviewDto.Rating,
            Comment = reviewDto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        SeedData.Reviews.Add(newReview);

        return CreatedAtAction(nameof(GetReviewsForProduct), new { productId = newReview.ProductId }, newReview);
    }
}

