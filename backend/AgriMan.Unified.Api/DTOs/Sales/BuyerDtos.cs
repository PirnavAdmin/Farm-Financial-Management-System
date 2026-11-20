using System.ComponentModel.DataAnnotations;

namespace SalesApi.DTOs;

public class CreateBuyerDto
{
    [MaxLength(50)]
    public string? BuyerCode { get; set; }

    [Required(ErrorMessage = "Buyer name is required.")]
    [MaxLength(150)]
    public string BuyerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required.")]
    [MaxLength(20)]
    public string Mobile { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? BusinessName { get; set; }

    [MaxLength(30)]
    public string? Gstin { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Opening balance cannot be negative.")]
    public decimal OpeningBalance { get; set; } = 0;

    [MaxLength(20)]
    public string Status { get; set; } = "Active";
}

public class UpdateBuyerDto : CreateBuyerDto
{
}

public class UpdateBuyerStatusDto
{
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
}

public class BuyerResponseDto
{
    public int Id { get; set; }
    public string BuyerCode { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? BusinessName { get; set; }
    public string? Gstin { get; set; }
    public decimal OpeningBalance { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Computed financial stats
    public int TotalSalesCount { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal OutstandingBalance { get; set; }
}

public class BuyerSummaryDto
{
    public int TotalBuyers { get; set; }
    public int ActiveBuyers { get; set; }
    public int InactiveBuyers { get; set; }
    public decimal TotalOpeningBalance { get; set; }
    public int TotalAssociatedSales { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal TotalOutstandingReceivables { get; set; }
}

public class BuyerLedgerDto
{
    public BuyerResponseDto Buyer { get; set; } = new();
    public List<SaleResponseDto> Sales { get; set; } = new();
    public List<SalesPaymentResponseDto> Payments { get; set; } = new();
}
