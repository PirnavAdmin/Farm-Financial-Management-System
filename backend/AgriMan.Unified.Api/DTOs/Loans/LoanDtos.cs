using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace FarmManagementApi.DTOs
{
    public class CreateLoanDto
    {
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

        [Range(1, 1000000000)]
        public decimal SanctionAmount { get; set; }

        public decimal? DisbursedAmount { get; set; }

        public decimal? OutstandingAmount { get; set; }

        [Range(0, 100)]
        public decimal InterestRate { get; set; }

        public string InterestType { get; set; } = "Fixed"; // Fixed, Floating

        public int TenureMonths { get; set; } = 12;

        public string RepaymentFrequency { get; set; } = "Monthly"; // Monthly, Quarterly, Half-Yearly, Yearly

        public decimal? Emi { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;

        public DateTime? EndDate { get; set; }

        public decimal ProcessingFees { get; set; } = 0;

        public string Status { get; set; } = "Active";

        public string? Remarks { get; set; }

        public int? FarmerId { get; set; }
    }

    public class UpdateLoanDto
    {
        public int LoanId { get; set; }

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

        [Range(1, 1000000000)]
        public decimal SanctionAmount { get; set; }

        public decimal? DisbursedAmount { get; set; }

        public decimal? OutstandingAmount { get; set; }

        [Range(0, 100)]
        public decimal InterestRate { get; set; }

        public string InterestType { get; set; } = "Fixed";

        public int TenureMonths { get; set; } = 12;

        public string RepaymentFrequency { get; set; } = "Monthly";

        public decimal? Emi { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public decimal ProcessingFees { get; set; } = 0;

        public string Status { get; set; } = "Active";

        public string? Remarks { get; set; }
    }

    public class LoanSummaryDto
    {
        public int ActiveLoans { get; set; }
        public int TotalLoans { get; set; }
        public decimal TotalSanctioned { get; set; }
        public decimal TotalDisbursed { get; set; }
        public decimal TotalOutstanding { get; set; }
        public decimal TotalAmountPaid { get; set; }
        public decimal TotalPrincipalPaid { get; set; }
        public decimal TotalInterestPaid { get; set; }
        public int UpcomingPaymentsCount { get; set; }
        public int OverdueInstallmentsCount { get; set; }
    }

    public class LoanPaymentSummaryDto
    {
        public int TotalPaymentsCount { get; set; }
        public decimal TotalAmountPaid { get; set; }
        public decimal PrincipalReductions { get; set; }
        public decimal InterestAndCharges { get; set; }
    }

    public class RecordDisbursementDto
    {
        [MaxLength(50)]
        public string? DisbursementNo { get; set; }

        public DateTime DisbursementDate { get; set; } = DateTime.UtcNow;

        [Range(1, 1000000000)]
        public decimal DisbursedAmount { get; set; }

        [MaxLength(150)]
        public string? BankAccount { get; set; }

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }

    public class RecordLoanPaymentDto
    {
        [MaxLength(50)]
        public string? VoucherNo { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public int? InstallmentNumber { get; set; }

        [Range(0, 1000000000)]
        public decimal Principal { get; set; }

        [Range(0, 1000000000)]
        public decimal Interest { get; set; }

        [Range(0, 1000000000)]
        public decimal Penalty { get; set; } = 0;

        public decimal? TotalPayment { get; set; }

        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Bank Transfer / NEFT / RTGS";

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(50)]
        public string? PaymentType { get; set; } // Regular EMI, Partial Payment, Advance Payment, Prepayment / Foreclosure
    }

    public class LoanClosureDto
    {
        public DateTime ClosedDate { get; set; } = DateTime.UtcNow;

        [Range(0, 1000000000)]
        public decimal FinalSettlementAmount { get; set; }

        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Bank Transfer / NEFT / RTGS";

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(500)]
        public string? ClosureCertificateUrl { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }

    public class LoanDocumentUploadDto
    {
        public IFormFile? File { get; set; }

        public string? DocumentType { get; set; }
    }
}
