using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AgriMan.Expenses.Api.Models;

/// <summary>
/// Child entity representing a payment ledger entry against an expense voucher.
/// </summary>
[Table("expense_payments")]
public class ExpensePayment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("expense_id")]
    public int ExpenseId { get; set; }

    [Column("payment_date")]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    [Column("payment_mode")]
    public string PaymentMode { get; set; } = "Cash";

    [Column("amount", TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("bank_or_cash")]
    public string BankOrCash { get; set; } = "Cash";

    [MaxLength(100)]
    [Column("reference_no")]
    public string? ReferenceNo { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "Completed";

    [MaxLength(500)]
    [Column("remarks")]
    public string? Remarks { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ExpenseTransaction? Expense { get; set; }
}
