namespace SalesApi.DTOs;

public class SaleResponseDto
{
    public int Id { get; set; }
    public string SalesNo { get; set; } = string.Empty;
    public DateTime SalesDate { get; set; }
    public string Buyer { get; set; } = string.Empty;
    public string Farm { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "kg";
    public decimal Rate { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal Commission { get; set; }
    public decimal Transport { get; set; }
    public decimal NetAmount { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
