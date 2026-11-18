using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class UserStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
    }

    public class UserListItemDto
    {
        public int Id { get; set; }
        public string UserCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public string Role { get; set; } = "User";
        public string Status { get; set; } = "Active";
        public string? LastLogin { get; set; }
        public string? ProfilePhoto { get; set; }
        public string Initials => string.Join("", (Name ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpper();
    }

    public class UserListResponseDto
    {
        public UserStatsDto Stats { get; set; } = new();
        public List<UserListItemDto> Users { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class CreateUserDto
    {
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        public string Email { get; set; } = string.Empty;

        public string? MobileNumber { get; set; }

        public int RoleId { get; set; } = 1;

        public string Password { get; set; } = "Password123!";
    }

    public class UpdateUserDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? MobileNumber { get; set; }
        public int? RoleId { get; set; }
        public bool? IsActive { get; set; }
    }
}
