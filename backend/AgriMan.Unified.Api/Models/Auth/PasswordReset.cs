using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("password_resets")]
    public class PasswordReset
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Identifier { get; set; } = string.Empty; // Mobile or Email

        public int? UserId { get; set; }
        public virtual User? User { get; set; }

        [Required]
        [MaxLength(10)]
        public string Otp { get; set; } = string.Empty; // e.g. 6-digit OTP

        [MaxLength(150)]
        public string? ResetToken { get; set; } // Generated upon OTP verification

        public bool IsVerified { get; set; } = false;

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(15);

        public DateTime? UsedAt { get; set; }

        [MaxLength(60)]
        public string? IpAddress { get; set; }
    }
}
