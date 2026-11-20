using System.ComponentModel.DataAnnotations;

namespace SalesApi.DTOs;

public class CreateSalesPaymentDto
{
    [MaxLength(50)]
    public string? PaymentNo { get; set; }

    public DateTime? PaymentDate { get; set; }

    public int? SaleId { get; set; }

    public int? BuyerId { get; set; }

    [MaxLength(150)]
    public string? Buyer { get; set; }

    [MaxLength(50)]
    public string? SalesNo { get; set; }

    [Required(ErrorMessage = "Payment amount is required.")]
    [Range(0.01, 1000000000, ErrorMessage = "Payment amount must be greater than 0.")]
    public decimal PaymentAmount { get; set; }

    [MaxLength(30)]
    public string PaymentMode { get; set; } = "Bank";

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(255)]
    public string? Remarks { get; set; }
}

public class UpdateSalesPaymentDto
{
    public DateTime? PaymentDate { get; set; }

    [Required(ErrorMessage = "Payment amount is required.")]
    [Range(0.01, 1000000000, ErrorMessage = "Payment amount must be greater than 0.")]
    public decimal PaymentAmount { get; set; }

    [MaxLength(30)]
    public string PaymentMode { get; set; } = "Bank";

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(255)]
    public string? Remarks { get; set; }
}

public class SalesPaymentResponseDto
{
    public int Id { get; set; }
    public int? SaleId { get; set; }
    public int? BuyerId { get; set; }
    public string PaymentNo { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string Buyer { get; set; } = string.Empty;
    public string SalesNo { get; set; } = string.Empty;
    public decimal PaymentAmount { get; set; }
    public string PaymentMode { get; set; } = "Bank";
    public string? ReferenceNo { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedSaleStatus { get; set; }
    public decimal? RemainingSaleBalance { get; set; }
}

public class PaymentModeBreakdownDto
{
    public string PaymentMode { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}

public class SalesPaymentSummaryDto
{
    public int TotalPaymentsCount { get; set; }
    public decimal TotalAmountReceived { get; set; }
    public decimal TotalSalesInvoiced { get; set; }
    public decimal TotalOutstandingReceivables { get; set; }
    public int PendingInvoicesCount { get; set; }
    public List<PaymentModeBreakdownDto> ByMode { get; set; } = new();
}

public class ReceivableItemDto
{
    public int Id { get; set; }
    public string SalesNo { get; set; } = string.Empty;
    public DateTime SalesDate { get; set; }
    public int? BuyerId { get; set; }
    public string Buyer { get; set; } = string.Empty;
    public string Farm { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public decimal GrossAmount { get; set; }
    public decimal TotalSalesAmount { get; set; }
    public decimal AmountReceived { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
    public int PaymentsCount { get; set; }
    public List<SalesPaymentResponseDto> Payments { get; set; } = new();
}

public class ReceivablesOverviewDto
{
    public decimal TotalReceivablesInvoiced { get; set; }
    public decimal TotalAmountReceived { get; set; }
    public decimal TotalOutstanding { get; set; }
    public int PendingInvoicesCount { get; set; }
    public int PartiallyPaidInvoicesCount { get; set; }
    public int PaidInvoicesCount { get; set; }
    public List<ReceivableItemDto> Items { get; set; } = new();
}

public class SyncReceivableDto
{
    [MaxLength(150)]
    public string? Buyer { get; set; }

    public DateTime? SalesDate { get; set; }

    [Range(0, 1000000000)]
    public decimal? TotalSalesAmount { get; set; }

    [Range(0, 1000000000)]
    public decimal AmountReceived { get; set; }

    [MaxLength(30)]
    public string? PaymentStatus { get; set; }

    [MaxLength(30)]
    public string? PaymentMode { get; set; }

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(255)]
    public string? Remarks { get; set; }
}
