namespace Titan_Project.Server.Domain.Entities;

public class Review
{
    private const int MinRating = 1;
    private const int MaxRating = 5;
    private const int MaxCommentLength = 1000;

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Review() { }

    private Review(
        Guid userId,
        Guid productId,
        int rating,
        string? comment,
        Guid? id = null,
        DateTime? createdAt = null)
    {
        ValidateReview(userId, productId, rating, comment, createdAt);

        Id = id ?? Guid.NewGuid();
        UserId = userId;
        ProductId = productId;
        Rating = rating;
        Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim();
        CreatedAt = createdAt ?? DateTime.UtcNow;
    }

    public static Review Create(Guid userId, Guid productId, int rating, string? comment)
    {
        return new Review(userId, productId, rating, comment);
    }

    private static void ValidateReview(
        Guid userId,
        Guid productId,
        int rating,
        string? comment,
        DateTime? createdAt)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));

        if (productId == Guid.Empty)
            throw new ArgumentException("ProductId cannot be empty.", nameof(productId));

        if (rating < MinRating || rating > MaxRating)
            throw new ArgumentOutOfRangeException(nameof(rating), rating, $"Rating must be between {MinRating} and {MaxRating}.");

        if (!string.IsNullOrWhiteSpace(comment) && comment.Trim().Length > MaxCommentLength)
            throw new ArgumentException($"Comment cannot exceed {MaxCommentLength} characters.", nameof(comment));

        if (createdAt.HasValue && createdAt.Value > DateTime.UtcNow)
            throw new ArgumentException("CreatedAt cannot be in the future.", nameof(createdAt));
    }
}
