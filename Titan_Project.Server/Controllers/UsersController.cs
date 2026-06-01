using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Application.Abstractions;
using Titan_Project.Server.Application.Auth;
using Titan_Project.Server.Application.Security;
using Titan_Project.Server.Contracts.Common;
using Titan_Project.Server.Contracts.Users;
using Titan_Project.Server.Domain.Model;
using Titan_Project.Server.Infrastructure.Data;

namespace Titan_Project.Server.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(
    AppDBContext db,
    IUserRepository users,
    IPasswordHasher hasher) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDto>>> ListUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await users.ListAsync(page, pageSize, ct);
        var userIds = items.Select(u => u.UserId).ToList();
        var reviewCounts = await db.Reviews
            .Where(r => userIds.Contains(r.UserId))
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var dtos = items.Select(user =>
        {
            reviewCounts.TryGetValue(user.UserId, out var count);
            return ToDto(user, count);
        }).ToList();

        return Ok(new PagedResult<UserDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
        });
    }

    [HttpGet("{userId:int}")]
    public async Task<ActionResult<UserDto>> GetUserProfile(int userId, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId, ct);
        if (user is null)
            return NotFound(new { error = "UserNotFound", message = "The selected user was not found." });

        var reviewsCount = await db.Reviews.CountAsync(r => r.UserId == userId, ct);
        return Ok(ToDto(user, reviewsCount));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = new User
        {
            Username = dto.Username.Trim(),
            Email = dto.Email.Trim(),
            PasswordHash = hasher.Hash(dto.Password),
            Country = dto.Country?.Trim(),
            Role = Roles.User,
        };

        try
        {
            var saved = await users.AddAsync(user, ct);
            return CreatedAtAction(nameof(GetUserProfile), new { userId = saved.UserId }, ToDto(saved, 0));
        }
        catch (DuplicateUserException ex)
        {
            return Conflict(new
            {
                error = ex.Field == DuplicateUserField.Username ? "UsernameTaken" : "EmailTaken",
                message = ex.Message,
            });
        }
    }

    [HttpPut("{userId:int}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int userId, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var existing = await users.FindByIdAsync(userId, ct);
        if (existing is null)
            return NotFound(new { error = "UserNotFound", message = "The selected user was not found." });

        var username = dto.Username?.Trim() ?? existing.Username;
        var email = dto.Email?.Trim() ?? existing.Email;

        if (await users.ExistsByUsernameAsync(username, userId, ct))
            return Conflict(new { error = "UsernameTaken", message = "Username is already taken." });

        if (await users.ExistsByEmailAsync(email, userId, ct))
            return Conflict(new { error = "EmailTaken", message = "Email is already taken." });

        existing.Username = username;
        existing.Email = email;
        existing.Country = dto.Country?.Trim() ?? existing.Country;

        if (!string.IsNullOrWhiteSpace(dto.Password))
            existing.PasswordHash = hasher.Hash(dto.Password);

        try
        {
            var updated = await users.UpdateAsync(existing, ct);
            if (updated is null)
                return NotFound(new { error = "UserNotFound", message = "The selected user was not found." });

            var reviewsCount = await db.Reviews.CountAsync(r => r.UserId == userId, ct);
            return Ok(ToDto(updated, reviewsCount));
        }
        catch (DuplicateUserException ex)
        {
            return Conflict(new
            {
                error = ex.Field == DuplicateUserField.Username ? "UsernameTaken" : "EmailTaken",
                message = ex.Message,
            });
        }
    }

    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> DeleteUser(int userId, CancellationToken ct)
    {
        var deleted = await users.DeleteAsync(userId, ct);
        if (!deleted)
            return NotFound(new { error = "UserNotFound", message = "The selected user was not found." });

        return NoContent();
    }

    private static UserDto ToDto(User user, int reviewsCount) => new()
    {
        UserId = user.UserId,
        Username = user.Username,
        Email = user.Email,
        Country = user.Country,
        Role = user.Role,
        CreatedAt = user.CreatedAt,
        ReviewsCount = reviewsCount,
    };
}
