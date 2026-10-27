namespace AgriMan.Api.DTOs
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string UserCode { get; set; } = string.Empty; // e.g. USR-001
        public string Name { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty; // e.g. AM
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string PrimaryRole { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string Status => IsActive ? "Active" : "Inactive";
        public DateTime? LastLoginAt { get; set; }
        public string LastLoginFormatted { get; set; } = "Never";
        public DateTime CreatedAt { get; set; }
        public string? ProfilePhoto { get; set; }
        public string? Photo => ProfilePhoto;
        public List<string> Permissions { get; set; } = new List<string>();
    }
}
