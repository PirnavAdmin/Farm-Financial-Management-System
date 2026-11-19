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
        public string FullName => Name;
        public string Email { get; set; } = string.Empty;
        public string? MobileNumber { get; set; }
        public string? PhoneNumber => MobileNumber;
        public string Role { get; set; } = "User";
        public string PrimaryRole => Role;
        public List<string> Roles { get; set; } = new();
        public List<string> Permissions { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public string Status { get; set; } = "Active";
        public DateTime? LastLoginAt { get; set; }
        public string? LastLogin { get; set; }
        public string? LastLoginFormatted => LastLogin;
        public string? ProfilePhoto { get; set; }
        public string? Photo => ProfilePhoto;
        public string Initials => string.Join("", (Name ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0])).ToUpper();
    }

    public class UserListResponseDto
    {
        public UserStatsDto Stats { get; set; } = new();
        public List<UserListItemDto> Users { get; set; } = new();
        public List<UserListItemDto> Items => Users;
        public int TotalCount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 1;
    }

    public class CreateUserDto
    {
        [Required(ErrorMessage = "Name is required.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        public string Email { get; set; } = string.Empty;

        public string? MobileNumber { get; set; }

        public int? RoleId { get; set; }

        public string? Role { get; set; }

        public List<string>? Roles { get; set; }

        public List<string>? Permissions { get; set; }

        public bool? IsActive { get; set; }

        public string Password { get; set; } = "Password123!";
    }

    public class UpdateUserDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? MobileNumber { get; set; }
        public int? RoleId { get; set; }
        public string? Role { get; set; }
        public List<string>? Roles { get; set; }
        public List<string>? Permissions { get; set; }
        public bool? IsActive { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class AssignUserRolesDto
    {
        public List<int>? RoleIds { get; set; }
        public List<string>? Roles { get; set; }
    }

    public class AssignUserPermissionsDto
    {
        public List<int>? PermissionIds { get; set; }
        public List<string>? Permissions { get; set; }
    }

    public class UploadUserPhotoDto
    {
        public string? ProfilePhoto { get; set; }
        public string? Base64Image { get; set; }
    }
}
