using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Agriman.Machinery.Api.Models;

[Table("machinery_expenses")]
public class MachineryExpense
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int? MachineryId { get; set; }

    [Required]
    [MaxLength(150)]
    public string MachineName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ExpenseType { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(150)]
    public string? Operator { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(MachineryId))]
    public Machinery? Machinery { get; set; }
}
