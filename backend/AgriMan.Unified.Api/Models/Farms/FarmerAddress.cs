using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("farmer_addresses")]
    public class FarmerAddress
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FarmerId { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [Required]
        [MaxLength(100)]
        public string Village { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Mandal { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string District { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string State { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string PinCode { get; set; } = string.Empty;

        // Navigation property
        [ForeignKey(nameof(FarmerId))]
        public virtual Farmer? Farmer { get; set; }
    }
}
