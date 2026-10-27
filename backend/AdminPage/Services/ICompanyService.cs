using AgriMan.Api.DTOs;

namespace AgriMan.Api.Services
{
    public interface ICompanyService
    {
        Task<CompanySettingResponse> GetSettingsAsync();
        Task<CompanySettingResponse> UpdateSettingsAsync(
            UpdateCompanySettingRequest request, 
            int? actorUserId = null, 
            string? actorName = null);
    }
}
