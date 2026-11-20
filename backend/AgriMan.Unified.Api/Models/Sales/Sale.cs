using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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

    public int? BuyerId { get; set; }

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

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(BuyerId))]
    [JsonIgnore]
    public Buyer? BuyerEntity { get; set; }

    public ICollection<SalesItem> Items { get; set; } = new List<SalesItem>();

    public ICollection<SalesPayment> Payments { get; set; } = new List<SalesPayment>();
}
