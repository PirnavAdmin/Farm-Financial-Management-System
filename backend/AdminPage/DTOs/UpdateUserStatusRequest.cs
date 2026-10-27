using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class UpdateUserStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }

    public class AssignRolesRequest
    {
        [Required]
        public List<string> Roles { get; set; } = new List<string>();
    }
}
