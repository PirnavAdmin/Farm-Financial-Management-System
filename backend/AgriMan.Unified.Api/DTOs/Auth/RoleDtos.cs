using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class PermissionResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Module { get; set; } = "General";
    }

    public class CreatePermissionDto
    {
        [Required(ErrorMessage = "Permission name is required.")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Module name is required.")]
        [MaxLength(50)]
        public string Module { get; set; } = "General";
    }

    public class RoleResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int UserCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    public class CreateRoleDto
    {
        [Required(ErrorMessage = "Role name is required.")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Role name must be between 2 and 50 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; }

        public List<int>? PermissionIds { get; set; }
        public List<string>? Permissions { get; set; }
    }

    public class UpdateRoleDto
    {
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Role name must be between 2 and 50 characters.")]
        public string? Name { get; set; }

        [MaxLength(250)]
        public string? Description { get; set; }

        public List<int>? PermissionIds { get; set; }
        public List<string>? Permissions { get; set; }
    }

    public class AssignRolePermissionsDto
    {
        public List<int>? PermissionIds { get; set; }
        public List<string>? Permissions { get; set; }
    }
}
