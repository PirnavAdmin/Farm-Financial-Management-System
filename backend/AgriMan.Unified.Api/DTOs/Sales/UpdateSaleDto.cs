using System.ComponentModel.DataAnnotations;

namespace SalesApi.DTOs;

public class UpdateSaleDto
{
    [MaxLength(50)]
    public string? SalesNo { get; set; }

    public DateTime? SalesDate { get; set; }

    public int? BuyerId { get; set; }

    [Required(ErrorMessage = "Buyer name is required.")]
    [MaxLength(150)]
    public string Buyer { get; set; } = string.Empty;

    [Required(ErrorMessage = "Farm name is required.")]
    [MaxLength(150)]
    public string Farm { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    [Range(0, 10000000, ErrorMessage = "Quantity cannot be negative.")]
    public decimal Quantity { get; set; }

    [MaxLength(20)]
    public string Unit { get; set; } = "kg";

    [Range(0, 10000000, ErrorMessage = "Rate cannot be negative.")]
    public decimal Rate { get; set; }

    public decimal? GrossAmount { get; set; }

    [Range(0, 100000000, ErrorMessage = "Commission cannot be negative.")]
    public decimal Commission { get; set; } = 0;

    [Range(0, 100000000, ErrorMessage = "Transport charge cannot be negative.")]
    public decimal Transport { get; set; } = 0;

    public decimal? NetAmount { get; set; }

    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Pending";

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public List<CreateSalesItemDto>? Items { get; set; }
}

public class UpdateSaleStatusDto
{
    [Required]
    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Pending";
}
