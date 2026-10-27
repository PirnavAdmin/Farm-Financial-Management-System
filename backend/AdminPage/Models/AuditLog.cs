using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("audit_logs")]
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? ActorUserId { get; set; }
        public virtual User? ActorUser { get; set; }

        [MaxLength(100)]
        public string? ActorName { get; set; }

        [Required]
        [MaxLength(60)]
        public string Action { get; set; } = string.Empty; // CREATE, UPDATE, ACTIVATE, DEACTIVATE, DELETE, ASSIGN_ROLES

        [Required]
        [MaxLength(60)]
        public string EntityType { get; set; } = string.Empty; // User, Role, Company

        [MaxLength(50)]
        public string? EntityId { get; set; }

        public string? Details { get; set; }

        [MaxLength(60)]
        public string? IpAddress { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
