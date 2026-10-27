using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/login-history")]
    public class LoginHistoryController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public LoginHistoryController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        /// <summary>
        /// Track user logins, failed login attempts, IP addresses, and timestamps
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PaginatedResponse<LoginHistoryResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoginHistory(
            [FromQuery] int? userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15)
        {
            var history = await _auditService.GetLoginHistoryAsync(userId, page, pageSize);
            return Ok(history);
        }
    }
}
