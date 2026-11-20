using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SalesApi.Models;

[Table("Buyers")]
public class Buyer
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string BuyerCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string BuyerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Mobile { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? BusinessName { get; set; }

    [MaxLength(30)]
    public string? Gstin { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningBalance { get; set; } = 0;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();

    [JsonIgnore]
    public ICollection<SalesPayment> Payments { get; set; } = new List<SalesPayment>();
}
