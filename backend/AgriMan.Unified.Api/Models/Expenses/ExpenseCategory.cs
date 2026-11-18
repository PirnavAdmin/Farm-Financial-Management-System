using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AgriMan.Expenses.Api.Models;

/// <summary>
/// Master entity representing a farm expense category (e.g., Fertilizers, Labour, Seeds, Machinery, Fuel).
/// </summary>
[Table("expense_categories")]
public class ExpenseCategory
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("description")]
    public string? Description { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<ExpenseTransaction> Expenses { get; set; } = new List<ExpenseTransaction>();
}
