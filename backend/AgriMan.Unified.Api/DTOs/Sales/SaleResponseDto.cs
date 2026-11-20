namespace SalesApi.DTOs;

public class SaleResponseDto
{
    public int Id { get; set; }
    public string SalesNo { get; set; } = string.Empty;
    public DateTime SalesDate { get; set; }
    public int? BuyerId { get; set; }
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
    public string? Remarks { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<SalesItemDto> Items { get; set; } = new();
    public List<SalesPaymentResponseDto> Payments { get; set; } = new();
}
