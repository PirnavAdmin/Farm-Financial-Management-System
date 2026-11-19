using System.Text;
using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/audit-logs")]
    [Route("api/v1/audit-logs")]
    [Produces("application/json")]
    public class AuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Filter and paginate security and administrative audit trail
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResultDto<AuditLogResponseDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? entityType = null,
            [FromQuery] string? action = null,
            [FromQuery] int? actorUserId = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BuildFilteredQuery(entityType, action, actorUserId, search, fromDate, toDate);
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogResponseDto
                {
                    Id = a.Id,
                    ActorUserId = a.ActorUserId,
                    ActorName = a.ActorName,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Details = a.Details,
                    IpAddress = a.IpAddress,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResultDto<AuditLogResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        /// <summary>
        /// Export filtered audit logs as CSV
        /// </summary>
        [HttpGet("export/csv")]
        [Produces("text/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string? entityType = null,
            [FromQuery] string? action = null,
            [FromQuery] int? actorUserId = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var rows = await BuildFilteredQuery(entityType, action, actorUserId, search, fromDate, toDate)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5000)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Id,TimestampUtc,ActorUserId,ActorName,Action,EntityType,EntityId,Details,IpAddress");

            foreach (var r in rows)
            {
                sb.AppendLine(string.Join(",",
                    r.Id,
                    CsvEscape(r.CreatedAt.ToString("O")),
                    r.ActorUserId?.ToString() ?? string.Empty,
                    CsvEscape(r.ActorName),
                    CsvEscape(r.Action),
                    CsvEscape(r.EntityType),
                    CsvEscape(r.EntityId),
                    CsvEscape(r.Details),
                    CsvEscape(r.IpAddress)));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"audit-logs-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");
        }

        private IQueryable<Models.AuditLog> BuildFilteredQuery(
            string? entityType,
            string? action,
            int? actorUserId,
            string? search,
            DateTime? fromDate,
            DateTime? toDate)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityType))
            {
                var et = entityType.Trim().ToLower();
                query = query.Where(a => a.EntityType.ToLower() == et);
            }

            if (!string.IsNullOrWhiteSpace(action))
            {
                var act = action.Trim().ToLower();
                query = query.Where(a => a.Action.ToLower() == act);
            }

            if (actorUserId.HasValue)
            {
                query = query.Where(a => a.ActorUserId == actorUserId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(a =>
                    (a.ActorName != null && a.ActorName.ToLower().Contains(s)) ||
                    a.Action.ToLower().Contains(s) ||
                    a.EntityType.ToLower().Contains(s) ||
                    (a.Details != null && a.Details.ToLower().Contains(s)) ||
                    (a.IpAddress != null && a.IpAddress.ToLower().Contains(s)));
            }

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.CreatedAt <= toDate.Value);
            }

            return query;
        }

        private static string CsvEscape(string? value)
        {
            if (string.IsNullOrEmpty(value)) return "\"\"";
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
    }
}
