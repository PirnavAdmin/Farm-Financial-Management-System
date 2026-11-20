using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("loans")]
    public class Loan
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string LoanNo { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? LoanAccountNo { get; set; }

        [Required]
        [MaxLength(150)]
        public string BankLender { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LoanType { get; set; } = "Crop Loan (KCC)";

        [MaxLength(500)]
        public string? LoanPurpose { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SanctionAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DisbursedAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OutstandingPrincipal { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal InterestRate { get; set; }

        [MaxLength(20)]
        public string InterestType { get; set; } = "Fixed"; // Fixed, Floating

        public int TenureMonths { get; set; } = 12;

        [MaxLength(30)]
        public string RepaymentFrequency { get; set; } = "Monthly"; // Monthly, Quarterly, Half-Yearly, Yearly

        [Column(TypeName = "decimal(18,2)")]
        public decimal EmiAmount { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;

        public DateTime EndDate { get; set; }

        public DateTime? NextEmiDueDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ProcessingFees { get; set; } = 0;

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Active"; // Active, Closed, Overdue, Pending

        [MaxLength(500)]
        public string? Remarks { get; set; }

        public DateTime? ClosedDate { get; set; }

        [MaxLength(500)]
        public string? ClosureCertificateUrl { get; set; }

        [MaxLength(500)]
        public string? ClosureRemarks { get; set; }

        public int? FarmerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Collections
        public virtual ICollection<LoanDisbursement> Disbursements { get; set; } = new List<LoanDisbursement>();
        public virtual ICollection<LoanInstallment> Installments { get; set; } = new List<LoanInstallment>();
        public virtual ICollection<LoanPayment> Payments { get; set; } = new List<LoanPayment>();
        public virtual ICollection<LoanDocument> Documents { get; set; } = new List<LoanDocument>();
    }
}
