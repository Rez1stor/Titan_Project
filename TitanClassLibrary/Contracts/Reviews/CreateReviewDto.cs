using System;

namespace Titan_Project.Server.Contracts.Reviews;

public class CreateReviewDto
{
	public int ProductId { get; set; }
	public int Rating { get; set; }
	public string? Comment { get; set; }
}
