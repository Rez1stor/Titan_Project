using System;

namespace Titan_Project.Server.Contracts.Reviews;

public class ReviewDto
{
	public int Id { get; set; }
	public int ProductId { get; set; }
	public string Username { get; set; } = string.Empty;
	public int Rating { get; set; }
	public string? Comment { get; set; }
	public DateTime CreatedAt { get; set; }
}
