using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesApi.Models;

[Table("Sales")]
public class Sale
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string SalesNo { get; set; } = string.Empty;

    [Required]
    public DateTime SalesDate { get; set; }

    [Required]
    [MaxLength(150)]
    public string Buyer { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Farm { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = "kg";

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Rate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal GrossAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Commission { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Transport { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal NetAmount { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
