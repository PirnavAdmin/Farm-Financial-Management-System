using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("refresh_tokens")]
    public class RefreshToken
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public bool IsRevoked { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        [NotMapped]
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
