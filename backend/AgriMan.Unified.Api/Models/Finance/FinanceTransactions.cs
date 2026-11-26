using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    public class FinancePayment
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentNo { get; set; } = string.Empty;

        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(150)]
        public string Party { get; set; } = string.Empty;

        [MaxLength(100)]
        public string PaymentType { get; set; } = "Supplier Payment";

        [MaxLength(150)]
        public string Purpose { get; set; } = "Supplier Payment";

        [MaxLength(120)]
        public string Category { get; set; } = "General Outflow";

        [MaxLength(100)]
        public string PayeeType { get; set; } = "Supplier / Vendor";

        [MaxLength(100)]
        public string? ContactInfo { get; set; }

        [MaxLength(150)]
        public string? Farm { get; set; }

        [MaxLength(120)]
        public string? FieldParcel { get; set; }

        [MaxLength(120)]
        public string? Crop { get; set; }

        [MaxLength(100)]
        public string? Season { get; set; }

        [MaxLength(50)]
        public string RefType { get; set; } = "None";

        [MaxLength(100)]
        public string? ReferenceTransaction { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OriginalAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal OutstandingAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal AdditionalCharges { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } = 0;

        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Bank Transfer";

        public int? BankAccountId { get; set; }

        [MaxLength(150)]
        public string BankAccount { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [MaxLength(100)]
        public string? ChequeNo { get; set; }

        public DateTime? ChequeDate { get; set; }

        public long? SupplierId { get; set; }

        public int? LabourId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "Completed";

        [MaxLength(300)]
        public string? CancellationReason { get; set; }

        public DateTime? CancelledAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }

    public class FinanceReceipt
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string ReceiptNo { get; set; } = string.Empty;

        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(150)]
        public string From { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Purpose { get; set; } = "Crop Sales";

        [MaxLength(120)]
        public string Category { get; set; } = "Crop Sales";

        [MaxLength(100)]
        public string PayerType { get; set; } = "Wholesale Buyer / Trader";

        [MaxLength(100)]
        public string? ContactInfo { get; set; }

        [MaxLength(150)]
        public string? Farm { get; set; }

        [MaxLength(120)]
        public string? FieldParcel { get; set; }

        [MaxLength(120)]
        public string? Crop { get; set; }

        [MaxLength(100)]
        public string? Season { get; set; }

        [MaxLength(50)]
        public string RefType { get; set; } = "None";

        [MaxLength(100)]
        public string? Reference { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OriginalAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal OutstandingAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal OtherCharges { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal FinalAmount { get; set; } = 0;

        [MaxLength(50)]
        public string PaymentMode { get; set; } = "Bank Transfer";

        public int? BankAccountId { get; set; }

        [MaxLength(150)]
        public string BankAccount { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? TransactionRef { get; set; }

        [MaxLength(100)]
        public string? ChequeNo { get; set; }

        public DateTime? ChequeDate { get; set; }

        public int? BuyerId { get; set; }

        public int? SaleId { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "Completed";

        [MaxLength(300)]
        public string? CancellationReason { get; set; }

        public DateTime? CancelledAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
