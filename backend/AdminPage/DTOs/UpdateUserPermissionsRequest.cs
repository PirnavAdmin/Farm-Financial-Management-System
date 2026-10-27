using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class UpdateUserPermissionsRequest
    {
        [Required]
        public List<string> Permissions { get; set; } = new List<string>();
    }
}
