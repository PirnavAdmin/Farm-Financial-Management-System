using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/audit-logs")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditLogsController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        /// <summary>
        /// Track administrative actions and system modifications
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResponse<AuditLogResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? entityType,
            [FromQuery] string? action,
            [FromQuery] int? actorUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            var logs = await _auditService.GetAuditLogsAsync(entityType, action, actorUserId, page, pageSize);
            return Ok(logs);
        }
    }
}
