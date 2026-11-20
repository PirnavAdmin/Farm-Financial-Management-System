using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("loan_disbursements")]
    public class LoanDisbursement
    {
        [Key]
        public int Id { get; set; }

        public int LoanId { get; set; }

        [Required]
        [MaxLength(50)]
        public string DisbursementNo { get; set; } = string.Empty;

        public DateTime DisbursementDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DisbursedAmount { get; set; }

        [MaxLength(150)]
        public string? BankAccount { get; set; }

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("LoanId")]
        public virtual Loan? Loan { get; set; }
    }
}
