namespace AgriMan.Api.DTOs
{
    public class AuditLogResponseDto
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

    public class LoginHistoryResponseDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? Email { get; set; }
        public string? Identifier { get; set; }
        public DateTime LoginAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public bool RememberMe { get; set; }
        public string? FailureReason { get; set; }
    }

    public class PaginatedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 1;
    }
}
