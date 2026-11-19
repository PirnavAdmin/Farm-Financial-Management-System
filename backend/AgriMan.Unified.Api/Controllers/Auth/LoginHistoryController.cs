using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/login-history")]
    [Route("api/v1/login-history")]
    [Produces("application/json")]
    public class LoginHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LoginHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Track system login attempts (success/failed), IP addresses, user agents, and timestamps
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResultDto<LoginHistoryResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoginHistory(
            [FromQuery] int? userId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.LoginHistories.AsNoTracking().AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var st = status.Trim().ToLower();
                query = query.Where(l => l.Status.ToLower() == st);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(l =>
                    (l.Email != null && l.Email.ToLower().Contains(s)) ||
                    (l.Identifier != null && l.Identifier.ToLower().Contains(s)) ||
                    (l.IpAddress != null && l.IpAddress.ToLower().Contains(s)) ||
                    (l.FailureReason != null && l.FailureReason.ToLower().Contains(s)));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.LoginAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new LoginHistoryResponseDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Email = l.Email,
                    Identifier = l.Identifier,
                    LoginAt = l.LoginAt,
                    Status = l.Status,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    RememberMe = l.RememberMe,
                    FailureReason = l.FailureReason
                })
                .ToListAsync();

            return Ok(new PaginatedResultDto<LoginHistoryResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
    }
}
