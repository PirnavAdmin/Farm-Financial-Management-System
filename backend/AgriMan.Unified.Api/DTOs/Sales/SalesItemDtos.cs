using System.ComponentModel.DataAnnotations;

namespace SalesApi.DTOs;

public class CreateSalesItemDto
{
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

    public decimal? Amount { get; set; }
}

public class UpdateSalesItemDto : CreateSalesItemDto
{
}

public class SalesItemDto
{
    public int Id { get; set; }
    public int? SaleId { get; set; }
    public string SalesNo { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "kg";
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}
