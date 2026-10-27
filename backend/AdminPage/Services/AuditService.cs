using AgriMan.Api.Data;
using AgriMan.Api.DTOs;
using AgriMan.Api.Models;
using Microsoft.EntityFrameworkCore;

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
            string action, 
            string entityType, 
            string? entityId, 
            string? details, 
            int? actorUserId = null, 
            string? actorName = null, 
            string? ipAddress = null)
        {
            try
            {
                var log = new AuditLog
                {
                    ActorUserId = actorUserId,
                    ActorName = actorName,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    Details = details,
                    IpAddress = ipAddress,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.AuditLogs.AddAsync(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record audit log for action: {Action}", action);
            }
        }

        public async Task LogLoginAttemptAsync(
            int? userId, 
            string? email, 
            bool success, 
            string? ipAddress, 
            string? userAgent, 
            string? failureReason = null)
        {
            try
            {
                var entry = new LoginHistory
                {
                    UserId = userId,
                    Email = email,
                    LoginAt = DateTime.UtcNow,
                    Status = success ? "Success" : "Failed",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    FailureReason = failureReason
                };

                await _context.LoginHistories.AddAsync(entry);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record login history for user: {Email}", email);
            }
        }

        public async Task<PaginatedResponse<AuditLogResponse>> GetAuditLogsAsync(
            string? entityType, 
            string? action, 
            int? actorUserId, 
            int page, 
            int pageSize)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityType))
            {
                query = query.Where(a => a.EntityType.ToLower() == entityType.Trim().ToLower());
            }

            if (!string.IsNullOrWhiteSpace(action))
            {
                query = query.Where(a => a.Action.ToLower() == action.Trim().ToLower());
            }

            if (actorUserId.HasValue)
            {
                query = query.Where(a => a.ActorUserId == actorUserId.Value);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogResponse
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

            return new PaginatedResponse<AuditLogResponse>(items, totalCount, page, pageSize);
        }

        public async Task<PaginatedResponse<LoginHistoryResponse>> GetLoginHistoryAsync(
            int? userId, 
            int page, 
            int pageSize)
        {
            var query = _context.LoginHistories
                .Include(l => l.User)
                .AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.LoginAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new LoginHistoryResponse
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    UserCode = l.User != null ? l.User.UserCode : "N/A",
                    UserName = l.User != null ? l.User.Name : (l.Email ?? "Unknown"),
                    Email = l.Email,
                    LoginAt = l.LoginAt,
                    Status = l.Status,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    FailureReason = l.FailureReason
                })
                .ToListAsync();

            return new PaginatedResponse<LoginHistoryResponse>(items, totalCount, page, pageSize);
        }
    }
}
