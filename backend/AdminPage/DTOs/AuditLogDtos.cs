namespace AgriMan.Api.DTOs
{
    public class AuditLogResponse
    {
        public int Id { get; set; }
        public int? ActorUserId { get; set; }
        public string? ActorName { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoginHistoryResponse
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserCode { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public DateTime LoginAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? FailureReason { get; set; }
    }
}
