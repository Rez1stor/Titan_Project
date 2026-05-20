using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Contracts.Reviews;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet("product/{productId:int}")]
    public ActionResult<IEnumerable<ReviewDto>> GetReviewsForProduct(int productId)
    {
        var reviews = SeedData.Reviews.Where(r => r.ProductId == productId).ToList();
        return Ok(reviews);
    }

    [HttpPost]
    [Authorize]
    public ActionResult<ReviewDto> CreateReview([FromBody] CreateReviewDto reviewDto)
    {
        var newReview = new ReviewDto
        {
            Id = SeedData.Reviews.Count + 1,
            ProductId = reviewDto.ProductId,
            Username = currentUser.Username!,
            Rating = reviewDto.Rating,
            Comment = reviewDto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        SeedData.Reviews.Add(newReview);

        return CreatedAtAction(nameof(GetReviewsForProduct), new { productId = newReview.ProductId }, newReview);
    }
}
