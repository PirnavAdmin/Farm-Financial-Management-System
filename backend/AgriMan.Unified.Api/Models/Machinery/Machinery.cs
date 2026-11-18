using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Agriman.Machinery.Api.Models;

[Table("machinery")]
public class Machinery
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string MachineName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string MachineType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RegistrationNo { get; set; }

    public DateTime? PurchaseDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PurchaseCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentValue { get; set; }

    [MaxLength(50)]
    public string? FuelType { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<MachineryExpense> Expenses { get; set; } = new List<MachineryExpense>();
}
