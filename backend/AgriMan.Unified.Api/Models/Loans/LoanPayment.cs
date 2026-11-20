using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("loan_payments")]
    public class LoanPayment
    {
        [Key]
        public int Id { get; set; }

        public int LoanId { get; set; }

        [Required]
        [MaxLength(50)]
        public string VoucherNo { get; set; } = string.Empty;

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public int? InstallmentNumber { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Principal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Interest { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Penalty { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPayment { get; set; }

        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Bank Transfer / NEFT / RTGS";

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(50)]
        public string PaymentType { get; set; } = "Regular EMI"; // Regular EMI, Partial Payment, Advance Payment, Prepayment / Foreclosure

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("LoanId")]
        public virtual Loan? Loan { get; set; }
    }
}
