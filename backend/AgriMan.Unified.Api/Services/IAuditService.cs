using System.Security.Claims;

namespace AgriMan.Api.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(
            int? actorUserId,
            string? actorName,
            string action,
            string entityType,
            string? entityId,
            string? details,
            string? ipAddress = null);

        (int? ActorUserId, string ActorName) GetActorFromPrincipal(ClaimsPrincipal? principal);
    }
}
