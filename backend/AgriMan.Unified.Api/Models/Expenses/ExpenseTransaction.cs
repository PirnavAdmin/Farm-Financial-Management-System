using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriMan.Expenses.Api.Models;

/// <summary>
/// Main entity representing a farm expense record (matches AGRIMAN Expenses UI).
/// </summary>
[Table("expense_transactions")]
public class ExpenseTransaction
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("expense_no")]
    public string ExpenseNo { get; set; } = string.Empty;

    [Column("expense_date")]
    public DateTime ExpenseDate { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("farmer")]
    public string Farmer { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("farm")]
    public string Farm { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("crop")]
    public string Crop { get; set; } = string.Empty;

    [Column("category_id")]
    public int? CategoryId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("expense_category")]
    public string ExpenseCategory { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("supplier")]
    public string Supplier { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("amount", TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("payment_mode")]
    public string PaymentMode { get; set; } = "Cash";

    [MaxLength(100)]
    [Column("reference_no")]
    public string? ReferenceNo { get; set; }

    [MaxLength(500)]
    [Column("remarks")]
    public string? Remarks { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "Paid";

    [MaxLength(500)]
    [Column("receipt_attachment_url")]
    public string? ReceiptAttachmentUrl { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ExpenseCategory? Category { get; set; }
    public ICollection<ExpenseItem> Items { get; set; } = new List<ExpenseItem>();
    public ICollection<ExpensePayment> Payments { get; set; } = new List<ExpensePayment>();
}
