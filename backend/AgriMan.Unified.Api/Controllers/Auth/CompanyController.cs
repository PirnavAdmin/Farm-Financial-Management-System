using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/company")]
    [Route("api/v1/company")]
    [Produces("application/json")]
    public class CompanyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public CompanyController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        /// <summary>
        /// Get organization profile and company settings
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(CompanySettingResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.CompanySettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CompanySetting
                {
                    CompanyName = "AGRIMAN Farms Pvt Ltd",
                    Email = "contact@agriman.in",
                    Phone = "+91 98765 00000",
                    Address = "Plot 42, Green Agro Tech Park, Farm City",
                    City = "Hyderabad",
                    Country = "India",
                    PostalCode = "500081",
                    TaxNumber = "GSTIN36AABCA1234F1Z5",
                    Currency = "INR",
                    Timezone = "Asia/Kolkata",
                    Website = "https://agriman.in",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.CompanySettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(MapResponse(settings));
        }

        /// <summary>
        /// Update organization profile and company settings
        /// </summary>
        [HttpPut]
        [ProducesResponseType(typeof(CompanySettingResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateCompanySettingDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var settings = await _context.CompanySettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CompanySetting();
                _context.CompanySettings.Add(settings);
            }

            settings.CompanyName = dto.CompanyName.Trim();
            if (dto.Email != null) settings.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
            if (dto.Phone != null) settings.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            if (dto.Address != null) settings.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
            if (dto.City != null) settings.City = string.IsNullOrWhiteSpace(dto.City) ? null : dto.City.Trim();
            if (dto.Country != null) settings.Country = string.IsNullOrWhiteSpace(dto.Country) ? null : dto.Country.Trim();
            if (dto.PostalCode != null) settings.PostalCode = string.IsNullOrWhiteSpace(dto.PostalCode) ? null : dto.PostalCode.Trim();
            if (dto.TaxNumber != null) settings.TaxNumber = string.IsNullOrWhiteSpace(dto.TaxNumber) ? null : dto.TaxNumber.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Currency)) settings.Currency = dto.Currency.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Timezone)) settings.Timezone = dto.Timezone.Trim();
            if (dto.Website != null) settings.Website = string.IsNullOrWhiteSpace(dto.Website) ? null : dto.Website.Trim();
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            await _auditService.LogActionAsync(actorId, actorName, "UPDATE", "Company", settings.Id.ToString(), $"Updated company settings for '{settings.CompanyName}'.", ip);

            return Ok(MapResponse(settings));
        }

        private static CompanySettingResponseDto MapResponse(CompanySetting s) => new()
        {
            Id = s.Id,
            CompanyName = s.CompanyName,
            Email = s.Email,
            Phone = s.Phone,
            Address = s.Address,
            City = s.City,
            Country = s.Country,
            PostalCode = s.PostalCode,
            TaxNumber = s.TaxNumber,
            Currency = s.Currency,
            Timezone = s.Timezone,
            Website = s.Website,
            UpdatedAt = s.UpdatedAt
        };
    }
}
