using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class RoleResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int UserCount { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoleRequest
    {
        [Required(ErrorMessage = "Role name is required.")]
        [MaxLength(50, ErrorMessage = "Role name cannot exceed 50 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }

        public List<int> PermissionIds { get; set; } = new List<int>();
    }

    public class UpdateRoleRequest
    {
        [Required(ErrorMessage = "Role name is required.")]
        [MaxLength(50, ErrorMessage = "Role name cannot exceed 50 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters.")]
        public string? Description { get; set; }
    }

    public class PermissionResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Module { get; set; } = string.Empty;
    }

    public class AssignPermissionsRequest
    {
        [Required]
        public List<int> PermissionIds { get; set; } = new List<int>();
    }
}
