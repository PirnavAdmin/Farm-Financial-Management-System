using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("farmers")]
    public class Farmer
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string FarmerCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string FarmerName { get; set; } = string.Empty;

        // Backward compatibility alias for FullName
        [NotMapped]
        public string FullName
        {
            get => FarmerName;
            set => FarmerName = value;
        }

        [MaxLength(100)]
        public string? FatherOrHusbandName { get; set; }

        [Required]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        // Backward compatibility alias for PhoneNumber
        [NotMapped]
        public string? PhoneNumber
        {
            get => Mobile;
            set => Mobile = value ?? string.Empty;
        }

        [MaxLength(20)]
        public string? AlternateMobile { get; set; }

        [MaxLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? AadhaarNo { get; set; }

        // Backward compatibility alias for AadhaarNumber
        [NotMapped]
        public string? AadhaarNumber
        {
            get => AadhaarNo;
            set => AadhaarNo = value;
        }

        [MaxLength(100)]
        public string? Village { get; set; }

        [MaxLength(100)]
        public string? Mandal { get; set; }

        [MaxLength(100)]
        public string? District { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalLand { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual FarmerAddress? Address { get; set; }
        public virtual FarmerBankAccount? BankAccount { get; set; }

        public virtual ICollection<Farm> Farms { get; set; } = new List<Farm>();
        public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
        public virtual ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    }
}
