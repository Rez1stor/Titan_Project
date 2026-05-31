using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Contracts.Reviews;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(AppDBContext db, ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviewsForProduct(int productId)
    {
        var reviews = await db.Reviews
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                UserId = r.UserId,
                ProductId = r.ProductId,
                Username = db.Users.Where(u => u.UserId == r.UserId).Select(u => u.Username).FirstOrDefault() ?? "Anonimowy koneser",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto reviewDto)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized(new { error = "NotAuthenticated", message = "Please sign in to leave a review." });

        var userId = currentUser.UserId.Value;
        var product = await db.AlcoholProducts.FirstOrDefaultAsync(p => p.ProductId == reviewDto.ProductId);
        if (product == null)
            return NotFound(new { error = "ProductNotFound", message = "The selected product was not found." });

        var existingReview = await db.Reviews.FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == reviewDto.ProductId);
        Titan_Project.Server.Domain.Model.Review review;
        var isUpdate = false;

        if (existingReview is null)
        {
            review = new Titan_Project.Server.Domain.Model.Review(userId, reviewDto.ProductId, reviewDto.Rating, reviewDto.Comment);
            db.Reviews.Add(review);
        }
        else
        {
            existingReview.Rating = reviewDto.Rating;
            existingReview.Comment = reviewDto.Comment;
            review = existingReview;
            isUpdate = true;
        }

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Possible unique constraint race: another request created the review concurrently.
            var recheck = await db.Reviews.FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == reviewDto.ProductId);
            if (recheck != null)
            {
                // Return the existing review as the effective result (treat as upsert)
                var existingDto = new ReviewDto
                {
                    Id = recheck.Id,
                    UserId = recheck.UserId,
                    ProductId = recheck.ProductId,
                    Username = await db.Users.Where(u => u.UserId == recheck.UserId).Select(u => u.Username).FirstOrDefaultAsync() ?? currentUser.Username ?? "Anonymous",
                    Rating = recheck.Rating,
                    Comment = recheck.Comment,
                    CreatedAt = recheck.CreatedAt
                };

                return Ok(existingDto);
            }

            return Conflict(new { error = "ReviewSaveFailed", message = ex.Message });
        }

        var dto = new ReviewDto
        {
            Id = review.Id,
            UserId = review.UserId,
            ProductId = review.ProductId,
            Username = await db.Users.Where(u => u.UserId == review.UserId).Select(u => u.Username).FirstOrDefaultAsync() ?? currentUser.Username ?? "Anonimowy koneser",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };

        return isUpdate
            ? Ok(dto)
            : CreatedAtAction(nameof(GetReviewsForProduct), new { productId = dto.ProductId }, dto);
    }

    [HttpPut("{reviewId:int}")]
    [Authorize]
    public async Task<ActionResult<ReviewDto>> UpdateReview(int reviewId, [FromBody] CreateReviewDto reviewDto)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized(new { error = "NotAuthenticated", message = "Please sign in to manage reviews." });

        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null)
            return NotFound(new { error = "ReviewNotFound", message = "The selected review was not found." });

        var currentDbUser = await db.Users.FirstOrDefaultAsync(u => u.UserId == currentUser.UserId.Value);
        var isOwner = review.UserId == currentUser.UserId.Value;
        var isAdminOrModerator = currentDbUser != null && (currentDbUser.Role == Titan_Project.Server.Application.Security.Roles.Admin || currentDbUser.Role == Titan_Project.Server.Application.Security.Roles.Moderator);

        if (!isOwner && !isAdminOrModerator)
            return Forbid();

        review.Rating = reviewDto.Rating;
        review.Comment = reviewDto.Comment;
        await db.SaveChangesAsync();

        return Ok(new ReviewDto
        {
            Id = review.Id,
            UserId = review.UserId,
            ProductId = review.ProductId,
            Username = await db.Users.Where(u => u.UserId == review.UserId).Select(u => u.Username).FirstOrDefaultAsync() ?? currentUser.Username ?? "Anonimowy koneser",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    [HttpDelete("{reviewId:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int reviewId)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Unauthorized(new { error = "NotAuthenticated", message = "Please sign in to manage reviews." });

        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null)
            return NotFound(new { error = "ReviewNotFound", message = "The selected review was not found." });

        var currentDbUser = await db.Users.FirstOrDefaultAsync(u => u.UserId == currentUser.UserId.Value);
        var isOwner = review.UserId == currentUser.UserId.Value;
        var isAdminOrModerator = currentDbUser != null && (currentDbUser.Role == Titan_Project.Server.Application.Security.Roles.Admin || currentDbUser.Role == Titan_Project.Server.Application.Security.Roles.Moderator);

        if (!isOwner && !isAdminOrModerator)
            return Forbid();

        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
