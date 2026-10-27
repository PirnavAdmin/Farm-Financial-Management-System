using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("login_history")]
    public class LoginHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? UserId { get; set; }
        public virtual User? User { get; set; }

        [MaxLength(150)]
        public string? Email { get; set; }

        public DateTime LoginAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Success"; // "Success" or "Failed"

        [MaxLength(60)]
        public string? IpAddress { get; set; }

        [MaxLength(300)]
        public string? UserAgent { get; set; }

        [MaxLength(250)]
        public string? FailureReason { get; set; }
    }
}
