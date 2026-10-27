using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Api.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string UserCode { get; set; } = string.Empty; // e.g. "USR-001"

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [NotMapped]
        public string FullName
        {
            get => Name;
            set => Name = value;
        }

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(25)]
        [Phone]
        public string? MobileNumber { get; set; }

        [NotMapped]
        public string? PhoneNumber
        {
            get => MobileNumber;
            set => MobileNumber = value;
        }

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public string? ProfilePhoto { get; set; }

        [MaxLength(100)]
        public string? PasswordResetToken { get; set; }

        public DateTime? ResetTokenExpires { get; set; }

        // Navigation Properties
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public virtual ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
        public virtual ICollection<LoginHistory> LoginHistories { get; set; } = new List<LoginHistory>();
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
