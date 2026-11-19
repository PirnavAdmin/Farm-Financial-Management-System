using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgriMan.Api.Data;
using AgriMan.Api.Models;

namespace AgriMan.Api.Services
{
    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogActionAsync(
            int? actorUserId,
            string? actorName,
            string action,
            string entityType,
            string? entityId,
            string? details,
            string? ipAddress = null)
        {
            try
            {
                var log = new AuditLog
                {
                    ActorUserId = actorUserId,
                    ActorName = string.IsNullOrWhiteSpace(actorName) ? "System" : actorName.Trim(),
                    Action = action.Trim(),
                    EntityType = entityType.Trim(),
                    EntityId = entityId,
                    Details = details,
                    IpAddress = ipAddress,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log for {Action} on {EntityType}/{EntityId}", action, entityType, entityId);
            }
        }

        public (int? ActorUserId, string ActorName) GetActorFromPrincipal(ClaimsPrincipal? principal)
        {
            if (principal == null)
            {
                return (null, "System");
            }

            var idValue = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            int? actorId = int.TryParse(idValue, out var parsed) ? parsed : null;

            var actorName = principal.FindFirst(ClaimTypes.Name)?.Value
                ?? principal.FindFirst(ClaimTypes.Email)?.Value
                ?? principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                ?? "Administrator";

            return (actorId, actorName);
        }
    }
}
