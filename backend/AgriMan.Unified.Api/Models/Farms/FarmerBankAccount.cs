using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("farmer_bank_accounts")]
    public class FarmerBankAccount
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FarmerId { get; set; }

        [Required]
        [MaxLength(100)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string IFSC { get; set; } = string.Empty;

        // Navigation property
        [ForeignKey(nameof(FarmerId))]
        public virtual Farmer? Farmer { get; set; }
    }
}
