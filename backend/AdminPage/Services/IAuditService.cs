using AgriMan.Api.DTOs;

namespace AgriMan.Api.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(
            string action, 
            string entityType, 
            string? entityId, 
            string? details, 
            int? actorUserId = null, 
            string? actorName = null, 
            string? ipAddress = null);

        Task LogLoginAttemptAsync(
            int? userId, 
            string? email, 
            bool success, 
            string? ipAddress, 
            string? userAgent, 
            string? failureReason = null);

        Task<PaginatedResponse<AuditLogResponse>> GetAuditLogsAsync(
            string? entityType, 
            string? action, 
            int? actorUserId, 
            int page, 
            int pageSize);

        Task<PaginatedResponse<LoginHistoryResponse>> GetLoginHistoryAsync(
            int? userId, 
            int page, 
            int pageSize);
    }
}
