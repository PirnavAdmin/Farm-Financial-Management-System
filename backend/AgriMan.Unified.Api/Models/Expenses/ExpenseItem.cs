using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AgriMan.Expenses.Api.Models;

/// <summary>
/// Child line-item entity representing specific items or services purchased within an expense voucher.
/// </summary>
[Table("expense_items")]
public class ExpenseItem
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("expense_id")]
    public int ExpenseId { get; set; }

    [Required]
    [MaxLength(150)]
    [Column("item_name")]
    public string ItemName { get; set; } = string.Empty;

    [Column("quantity", TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; } = 1;

    [Required]
    [MaxLength(20)]
    [Column("unit")]
    public string Unit { get; set; } = "unit";

    [Column("unit_price", TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; } = 0;

    [Column("total_amount", TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; } = 0;

    [MaxLength(255)]
    [Column("remarks")]
    public string? Remarks { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ExpenseTransaction? Expense { get; set; }
}
