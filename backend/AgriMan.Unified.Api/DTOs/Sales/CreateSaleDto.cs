using System.ComponentModel.DataAnnotations;

namespace SalesApi.DTOs;

public class CreateSaleDto
{
    [MaxLength(50)]
    public string? SalesNo { get; set; }

    public DateTime? SalesDate { get; set; }

    [Required(ErrorMessage = "Buyer name is required.")]
    [MaxLength(150)]
    public string Buyer { get; set; } = string.Empty;

    [Required(ErrorMessage = "Farm name is required.")]
    [MaxLength(150)]
    public string Farm { get; set; } = string.Empty;

    [Required(ErrorMessage = "Crop name is required.")]
    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    [Required(ErrorMessage = "Quantity is required.")]
    [Range(0.01, 10000000, ErrorMessage = "Quantity must be greater than 0.")]
    public decimal Quantity { get; set; }

    [MaxLength(20)]
    public string Unit { get; set; } = "kg";

    [Required(ErrorMessage = "Rate is required.")]
    [Range(0.01, 10000000, ErrorMessage = "Rate must be greater than 0.")]
    public decimal Rate { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal Commission { get; set; } = 0;

    public decimal Transport { get; set; } = 0;

    public decimal? NetAmount { get; set; }

    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Pending";
}
