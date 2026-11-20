using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("supplier_transactions")]
    public class SupplierTransaction
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("transaction_code")]
        public string TransactionCode { get; set; } = string.Empty;

        [Required]
        [Column("transaction_date")]
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow.Date;

        [Required]
        [Column("supplier_id")]
        public long SupplierId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("supplier_name")]
        public string SupplierName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("transaction_type")]
        public string TransactionType { get; set; } = "Purchase";

        [MaxLength(100)]
        [Column("reference_no")]
        public string? ReferenceNo { get; set; }

        [MaxLength(100)]
        [Column("category")]
        public string? Category { get; set; }

        [Column("items_summary")]
        public string? ItemsSummary { get; set; }

        [Column("amount", TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }

        [Column("paid_amount", TypeName = "decimal(12,2)")]
        public decimal PaidAmount { get; set; }

        [Column("balance_amount", TypeName = "decimal(12,2)")]
        public decimal BalanceAmount { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("payment_status")]
        public string PaymentStatus { get; set; } = "Pending";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(SupplierId))]
        public Supplier? Supplier { get; set; }
    }
}
