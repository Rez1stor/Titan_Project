using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Titan_Project.Server.Domain.Model;

public class Review
{
    private const int MinRating = 1;
    private const int MaxRating = 5;
    private const int MaxCommentLength = 1000;

    private int _rating;
    private string? _comment;

    [Key]
    public int Id { get; set; }
    [Required]
    [ForeignKey(nameof(UserId))]
    public int UserId { get; set; }
    [Required]
    [ForeignKey(nameof(ProductId))]
    public int ProductId { get; set; }
    public int Rating 
    { 
        get => _rating;
        set
        {
            if (value < MinRating || value > MaxRating)
                throw new ArgumentOutOfRangeException(nameof(Rating), value, $"Rating must be between {MinRating} and {MaxRating}.");
            _rating = value;
        }
    }
    public string? Comment 
    { 
        get => _comment;
        set
        {
            if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length > MaxCommentLength)
                throw new ArgumentException($"Comment cannot exceed {MaxCommentLength} characters.", nameof(Comment));
            _comment = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
    public DateTime CreatedAt
    { 
        get;
        private set;
    } = DateTime.UtcNow;

    public Review() { }

    public Review(
        int userId,
        int productId,
        int rating,
        string? comment)
    {
        UserId = userId;
        ProductId = productId;
        Rating = rating;
        Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim();
    }
}
