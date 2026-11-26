using System.ComponentModel.DataAnnotations;

namespace AgriMan.Unified.Api.DTOs.Crops;

/// <summary>
/// Query filters for Crop Profitability and Unit Economics endpoints.
/// </summary>
public class CropProfitabilityQueryParameters
{
    /// <summary>Filter by crop name (case-insensitive).</summary>
    public string? Crop { get; set; }

    /// <summary>Filter by master Crop ID.</summary>
    public int? CropId { get; set; }

    /// <summary>Filter by farm name (case-insensitive substring match).</summary>
    public string? Farm { get; set; }

    /// <summary>Filter by Farm ID (applies to crop seasons and farm name lookup).</summary>
    public int? FarmId { get; set; }

    /// <summary>Filter by season name (case-insensitive substring match).</summary>
    public string? Season { get; set; }

    /// <summary>Filter by CropSeason ID.</summary>
    public int? SeasonId { get; set; }

    /// <summary>Inclusive start date for sales, income, expense, and labour attendance transactions.</summary>
    public DateTime? FromDate { get; set; }

    /// <summary>Inclusive end date for sales, income, expense, and labour attendance transactions.</summary>
    public DateTime? ToDate { get; set; }

    /// <summary>Include crop-tagged LabourAttendance records in Labour expenses (default: true).</summary>
    public bool IncludeLabourAttendance { get; set; } = true;

    /// <summary>Include crop-tagged CropActivity costs in Other expenses (default: false to avoid double counting).</summary>
    public bool IncludeCropActivities { get; set; } = false;

    /// <summary>Include zero-value standard expense categories in ExpenseBreakdown (default: true).</summary>
    public bool IncludeZeroCategories { get; set; } = true;

    /// <summary>Include crops from master table that currently have zero income and zero expenses (default: true).</summary>
    public bool IncludeInactiveOrEmptyCrops { get; set; } = true;

    /// <summary>Optional area override in acres when querying a single crop.</summary>
    [Range(0, 1000000)]
    public decimal? AreaAcres { get; set; }

    /// <summary>Optional total quantity override in kg when querying a single crop.</summary>
    [Range(0, 1000000000)]
    public decimal? TotalQuantityKg { get; set; }
}

/// <summary>
/// Standardized AgriMan expense category summary for a crop.
/// </summary>
public class CropExpenseCategorySummaryDto
{
    public decimal Seeds { get; set; }
    public decimal Fertilizer { get; set; }
    public decimal Pesticides { get; set; }
    public decimal Labour { get; set; }
    public decimal Diesel { get; set; }
    public decimal Machinery { get; set; }
    public decimal Transport { get; set; }
    public decimal Other { get; set; }
}

/// <summary>
/// Line item inside IncomeBreakdown or ExpenseBreakdown.
/// </summary>
public class CropFinancialLineItemDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount { get; set; } = string.Empty;
    public int RecordCount { get; set; }
}

/// <summary>
/// Unit economics and profitability metrics for a crop.
/// </summary>
public class CropProfitabilityMetricsDto
{
    /// <summary>Total Expenses / Area (Acres)</summary>
    public decimal CostPerAcre { get; set; }

    /// <summary>Total Income / Area (Acres)</summary>
    public decimal IncomePerAcre { get; set; }

    /// <summary>Net Profit / Area (Acres)</summary>
    public decimal ProfitPerAcre { get; set; }

    /// <summary>Total Expenses / Total Quantity (Kg)</summary>
    public decimal CostPerKg { get; set; }

    /// <summary>Crop Sales Income / Total Sold Quantity (Kg)</summary>
    public decimal SellingPricePerKg { get; set; }

    /// <summary>(Net Profit / Total Expenses) * 100</summary>
    public decimal RoiPercent { get; set; }

    /// <summary>(Net Profit / Total Income) * 100</summary>
    public decimal ProfitMarginPercent { get; set; }
}

/// <summary>
/// Complete P&amp;L and important metrics report for a single crop.
/// </summary>
public class CropProfitabilityItemDto
{
    public int? CropId { get; set; }
    public string Crop { get; set; } = string.Empty;
    public string? CropCode { get; set; }
    public string? CropType { get; set; }

    public decimal AreaAcres { get; set; }
    public string AreaDisplay { get; set; } = "0 Acres";

    // Income Section
    public decimal CropSales { get; set; }
    public decimal GrossCropSales { get; set; }
    public decimal SalesDeductions { get; set; }
    public decimal OtherIncome { get; set; }
    public decimal TotalIncome { get; set; }
    public List<CropFinancialLineItemDto> IncomeBreakdown { get; set; } = new();

    // Expenses Section
    public CropExpenseCategorySummaryDto ExpensesByCategory { get; set; } = new();
    public List<CropFinancialLineItemDto> ExpenseBreakdown { get; set; } = new();
    public decimal TotalExpenses { get; set; }

    // Profit Section
    public decimal NetProfit { get; set; }
    public string NetProfitFormula { get; set; } = "Total Income - Total Expenses";
    public string ProfitStatus { get; set; } = "Break-even";

    // Quantity / Yield Summary
    public decimal SoldQuantityKg { get; set; }
    public decimal PrimarySoldQuantity { get; set; }
    public string? PrimarySoldUnit { get; set; }

    // Important Metrics
    public CropProfitabilityMetricsDto Metrics { get; set; } = new();

    // Formatted Display Values (INR)
    public string FormattedCropSales { get; set; } = "₹0";
    public string FormattedTotalIncome { get; set; } = "₹0";
    public string FormattedTotalExpenses { get; set; } = "₹0";
    public string FormattedNetProfit { get; set; } = "₹0";

    // Context & Audit Counts
    public List<string> Farms { get; set; } = new();
    public List<string> Seasons { get; set; } = new();
    public int SalesCount { get; set; }
    public int IncomeTransactionCount { get; set; }
    public int ExpenseTransactionCount { get; set; }
    public int LabourAttendanceCount { get; set; }
    public int CropActivityCount { get; set; }
}

/// <summary>
/// Portfolio-level totals across all matching crops.
/// </summary>
public class CropProfitabilitySummaryTotalsDto
{
    public int TotalCrops { get; set; }
    public int ProfitableCrops { get; set; }
    public int LossMakingCrops { get; set; }
    public decimal TotalAreaAcres { get; set; }
    public decimal TotalCropSales { get; set; }
    public decimal TotalOtherIncome { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalNetProfit { get; set; }
    public decimal TotalSoldQuantityKg { get; set; }
    public CropExpenseCategorySummaryDto TotalExpensesByCategory { get; set; } = new();
    public CropProfitabilityMetricsDto OverallMetrics { get; set; } = new();
    public string FormattedTotalIncome { get; set; } = "₹0";
    public string FormattedTotalExpenses { get; set; } = "₹0";
    public string FormattedTotalNetProfit { get; set; } = "₹0";
}

/// <summary>
/// Response envelope for GET /api/crop-profitability.
/// </summary>
public class CropProfitabilityOverviewDto
{
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public CropProfitabilityAppliedFiltersDto Filters { get; set; } = new();
    public CropProfitabilitySummaryTotalsDto Summary { get; set; } = new();
    public List<CropProfitabilityItemDto> Crops { get; set; } = new();
}

public class CropProfitabilityAppliedFiltersDto
{
    public string? Crop { get; set; }
    public int? CropId { get; set; }
    public string? Farm { get; set; }
    public int? FarmId { get; set; }
    public string? Season { get; set; }
    public int? SeasonId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool IncludeLabourAttendance { get; set; }
    public bool IncludeCropActivities { get; set; }
}

/// <summary>
/// Stateless calculation request for computing P&amp;L and unit economics for a crop scenario.
/// </summary>
public class CropProfitabilityCalculationRequest
{
    [Required(ErrorMessage = "Crop name is required.")]
    [MaxLength(100)]
    public string Crop { get; set; } = string.Empty;

    [Range(0, 1000000, ErrorMessage = "AreaAcres cannot be negative.")]
    public decimal AreaAcres { get; set; }

    /// <summary>Total crop yield/sales quantity in Kg (optional, used for Cost/Kg and Selling Price/Kg).</summary>
    [Range(0, 1000000000, ErrorMessage = "QuantityKg cannot be negative.")]
    public decimal QuantityKg { get; set; }

    // Income
    [Range(0, 999999999999)]
    public decimal CropSales { get; set; }

    [Range(0, 999999999999)]
    public decimal OtherIncome { get; set; }

    // Expenses
    [Range(0, 999999999999)]
    public decimal Seeds { get; set; }

    [Range(0, 999999999999)]
    public decimal Fertilizer { get; set; }

    [Range(0, 999999999999)]
    public decimal Pesticides { get; set; }

    [Range(0, 999999999999)]
    public decimal Labour { get; set; }

    [Range(0, 999999999999)]
    public decimal Diesel { get; set; }

    [Range(0, 999999999999)]
    public decimal Machinery { get; set; }

    [Range(0, 999999999999)]
    public decimal Transport { get; set; }

    [Range(0, 999999999999)]
    public decimal OtherExpenses { get; set; }

    /// <summary>Optional extra custom expense items beyond the 7 standard categories.</summary>
    public List<CustomCropExpenseInputDto>? AdditionalExpenses { get; set; }
}

public class CustomCropExpenseInputDto
{
    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Range(0, 999999999999)]
    public decimal Amount { get; set; }
}
