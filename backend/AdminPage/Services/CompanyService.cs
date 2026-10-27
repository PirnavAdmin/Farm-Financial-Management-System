using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Api.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public CompanyService(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        public async Task<CompanySettingResponse> GetSettingsAsync()
        {
            var setting = await _context.CompanySettings.FirstOrDefaultAsync();
            if (setting == null)
            {
                setting = new CompanySetting
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
                await _context.CompanySettings.AddAsync(setting);
                await _context.SaveChangesAsync();
            }

            return MapToResponse(setting);
        }

        public async Task<CompanySettingResponse> UpdateSettingsAsync(
            UpdateCompanySettingRequest request, 
            int? actorUserId = null, 
            string? actorName = null)
        {
            var setting = await _context.CompanySettings.FirstOrDefaultAsync();
            if (setting == null)
            {
                setting = new CompanySetting();
                await _context.CompanySettings.AddAsync(setting);
            }

            setting.CompanyName = request.CompanyName.Trim();
            setting.Email = request.Email?.Trim();
            setting.Phone = request.Phone?.Trim();
            setting.Address = request.Address?.Trim();
            setting.City = request.City?.Trim();
            setting.Country = request.Country?.Trim();
            setting.PostalCode = request.PostalCode?.Trim();
            setting.TaxNumber = request.TaxNumber?.Trim();
            setting.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "INR" : request.Currency.Trim();
            setting.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "Asia/Kolkata" : request.Timezone.Trim();
            setting.Website = request.Website?.Trim();
            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(
                action: "UPDATE",
                entityType: "CompanySettings",
                entityId: setting.Id.ToString(),
                details: $"Updated organization settings for '{setting.CompanyName}'.",
                actorUserId: actorUserId,
                actorName: actorName
            );

            return MapToResponse(setting);
        }

        private static CompanySettingResponse MapToResponse(CompanySetting s)
        {
            return new CompanySettingResponse
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
}
