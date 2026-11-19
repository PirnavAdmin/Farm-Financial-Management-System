using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("supplier_payments")]
    public class SupplierPayment
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("payment_code")]
        public string PaymentCode { get; set; } = string.Empty;

        [Required]
        [Column("payment_date")]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow.Date;

        [Required]
        [Column("supplier_id")]
        public long SupplierId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("supplier_name")]
        public string SupplierName { get; set; } = string.Empty;

        [Required]
        [Column("amount_paid", TypeName = "decimal(12,2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("payment_mode")]
        public string PaymentMode { get; set; } = "Bank Transfer";

        [MaxLength(100)]
        [Column("reference_no")]
        public string? ReferenceNo { get; set; }

        [MaxLength(120)]
        [Column("bank_account")]
        public string? BankAccount { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(SupplierId))]
        public Supplier? Supplier { get; set; }
    }
}
