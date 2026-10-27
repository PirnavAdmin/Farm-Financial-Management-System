using System.Security.Claims;
using AgriMan.Api.DTOs;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Route("api/v1/company")]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompanyController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        /// <summary>
        /// Get organization details and company settings
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(CompanySettingResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _companyService.GetSettingsAsync();
            return Ok(settings);
        }

        /// <summary>
        /// Update organization details and company settings
        /// </summary>
        [HttpPut]
        [ProducesResponseType(typeof(CompanySettingResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateCompanySettingRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (actorId, actorName) = GetCurrentActor();
            var updated = await _companyService.UpdateSettingsAsync(request, actorId, actorName);
            return Ok(updated);
        }

        private (int? actorId, string? actorName) GetCurrentActor()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value;

            int? actorId = int.TryParse(idClaim, out int parsed) ? parsed : null;
            return (actorId, nameClaim ?? "Administrator");
        }
    }
}
