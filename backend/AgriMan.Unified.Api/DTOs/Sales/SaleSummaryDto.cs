namespace SalesApi.DTOs;

public class SaleQueryParameters
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Buyer { get; set; }
    public string? Crop { get; set; }
    public string? Farm { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SortBy { get; set; } = "DateDesc"; // DateDesc, DateAsc, AmountDesc, AmountAsc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 10));
}

public class SaleSummaryDto
{
    public int TotalSalesCount { get; set; }
    public decimal TotalGrossAmount { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalTransport { get; set; }
    public decimal TotalNetAmount { get; set; }
    public int PendingCount { get; set; }
    public int PartPaidCount { get; set; }
    public int PaidCount { get; set; }
    public decimal PendingAmount { get; set; }
    public decimal PaidAmount { get; set; }
}

public class SalesBreakdownItemDto
{
    public string Key { get; set; } = string.Empty;
    public int SalesCount { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal Commission { get; set; }
    public decimal Transport { get; set; }
    public decimal NetAmount { get; set; }
    public decimal AmountReceived { get; set; }
    public decimal OutstandingAmount { get; set; }
}

public class MonthlySalesTrendDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty;
    public int SalesCount { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal AmountReceived { get; set; }
}

public class SalesAnalyticsDto
{
    public SaleSummaryDto Summary { get; set; } = new();
    public List<SalesBreakdownItemDto> ByCrop { get; set; } = new();
    public List<SalesBreakdownItemDto> ByBuyer { get; set; } = new();
    public List<SalesBreakdownItemDto> ByFarm { get; set; } = new();
    public List<MonthlySalesTrendDto> MonthlyTrend { get; set; } = new();
}
