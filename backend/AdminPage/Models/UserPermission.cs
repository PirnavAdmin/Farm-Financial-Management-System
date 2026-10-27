using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("user_permissions")]
    public class UserPermission
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int PermissionId { get; set; }
        public virtual Permission Permission { get; set; } = null!;
    }
}
