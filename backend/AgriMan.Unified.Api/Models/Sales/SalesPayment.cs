using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesApi.Models;

[Table("SalesPayments")]
public class SalesPayment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentNo { get; set; } = string.Empty;

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [MaxLength(150)]
    public string Buyer { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string SalesNo { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaymentAmount { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentMode { get; set; } = "Bank"; // Cash, Bank, UPI

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(255)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
