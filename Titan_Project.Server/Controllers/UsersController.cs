using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDBContext db, IUserRepository users) : ControllerBase
{
    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetUserProfile(int userId)
    {
        var user = await users.FindByIdAsync(userId, CancellationToken.None);
        if (user == null)
            return NotFound(new { error = "UserNotFound", message = "The selected user was not found." });

        var reviewsCount = await db.Reviews.CountAsync(r => r.UserId == userId);

        return Ok(new
        {
            userId = user.UserId,
            username = user.Username,
            email = user.Email,
            country = user.Country,
            role = user.Role,
            createdAt = user.CreatedAt,
            reviewsCount,
        });
    }
}