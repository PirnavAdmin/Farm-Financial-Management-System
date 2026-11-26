namespace FarmManagementApi.DTOs.Reports;

/// <summary>
/// Common query parameters supported across Module 19 Reports.
/// </summary>
public class ReportQueryParameters
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? Year { get; set; }
    public int? Month { get; set; }
    public string? Farm { get; set; }
    public string? Crop { get; set; }
    public string? Season { get; set; }
    public string? Category { get; set; }
    public string? Party { get; set; }
    public string? Location { get; set; }
    public string? Status { get; set; }
    public string? TransactionType { get; set; }
    public int? ProductId { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class ReportCatalogItemDto
{
    public string Key { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string ExportEndpoint { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ReportResponse<TSummary, TRow>
{
    public string ReportKey { get; set; } = string.Empty;
    public string ReportTitle { get; set; } = string.Empty;
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public ReportQueryParameters Filters { get; set; } = new();
    public TSummary Summary { get; set; } = default!;
    public List<TRow> Rows { get; set; } = new();
}

// =========================================================================
// A. FINANCIAL REPORTS (1 - 10)
// =========================================================================

// 1. Daily Income & 3. Monthly Income & 5. Annual Income
public class PeriodIncomeSummaryDto
{
    public decimal TotalCropSalesRevenue { get; set; }
    public decimal TotalOtherIncome { get; set; }
    public decimal TotalGrossIncome { get; set; }
    public decimal TotalNetIncome { get; set; }
    public int TotalTransactions { get; set; }
    public int PeriodCount { get; set; }
    public decimal AveragePerPeriod { get; set; }
    public string PeakPeriod { get; set; } = string.Empty;
    public decimal PeakAmount { get; set; }
}

public class PeriodIncomeRowDto
{
    public string PeriodKey { get; set; } = string.Empty;
    public string PeriodLabel { get; set; } = string.Empty;
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int CropSalesCount { get; set; }
    public decimal CropSalesRevenue { get; set; }
    public int OtherIncomeCount { get; set; }
    public decimal OtherIncome { get; set; }
    public int TotalTransactions { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal? GrowthPercent { get; set; }
    public string? TopCrop { get; set; }
    public string? TopFarm { get; set; }
}

// 2. Daily Expense & 4. Monthly Expense & 6. Annual Expense
public class PeriodExpenseSummaryDto
{
    public decimal TotalOperatingExpenses { get; set; }
    public decimal TotalLabourWages { get; set; }
    public decimal TotalMachineryExpenses { get; set; }
    public decimal TotalInputPurchases { get; set; }
    public decimal TotalExpense { get; set; }
    public int TotalTransactions { get; set; }
    public int PeriodCount { get; set; }
    public decimal AveragePerPeriod { get; set; }
    public string PeakPeriod { get; set; } = string.Empty;
    public decimal PeakAmount { get; set; }
}

public class PeriodExpenseRowDto
{
    public string PeriodKey { get; set; } = string.Empty;
    public string PeriodLabel { get; set; } = string.Empty;
    public int? Year { get; set; }
    public int? Month { get; set; }
    public decimal OperatingExpenses { get; set; }
    public decimal LabourWages { get; set; }
    public decimal MachineryExpenses { get; set; }
    public decimal InputPurchases { get; set; }
    public int TotalTransactions { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal? ChangePercent { get; set; }
    public string? TopCategory { get; set; }
}

// 7. Profit & Loss
public class ProfitAndLossReportDto
{
    public decimal TotalRevenue { get; set; }
    public decimal CropSalesRevenue { get; set; }
    public decimal OtherFarmIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal OperatingExpenses { get; set; }
    public decimal LabourWages { get; set; }
    public decimal MachineryExpenses { get; set; }
    public decimal InputPurchases { get; set; }
    public decimal LoanInterestPaid { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitMarginPercent { get; set; }
    public object Period { get; set; } = new { };
    public List<CategoryBreakdownDto> IncomeByCategory { get; set; } = new();
    public List<CategoryBreakdownDto> ExpenseByCategory { get; set; } = new();
    public List<MonthlyPnlRowDto> MonthlyTrend { get; set; } = new();
}

public class CategoryBreakdownDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Amount { get; set; }
    public decimal SharePercent { get; set; }
}

public class MonthlyPnlRowDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetProfit { get; set; }
}

// 8. Cash Flow
public class CashFlowReportDto
{
    public decimal TotalCashInflow { get; set; }
    public decimal TotalCashOutflow { get; set; }
    public decimal NetCashFlow { get; set; }
    public decimal FinanceReceiptsInflow { get; set; }
    public decimal SalesCollectionsInflow { get; set; }
    public decimal IncomePaymentsInflow { get; set; }
    public decimal FinancePaymentsOutflow { get; set; }
    public decimal ExpensePaymentsOutflow { get; set; }
    public decimal SupplierPaymentsOutflow { get; set; }
    public decimal PurchasePaymentsOutflow { get; set; }
    public decimal LabourPaymentsOutflow { get; set; }
    public decimal LoanPaymentsOutflow { get; set; }
    public List<CashFlowModeSummaryDto> ByPaymentMode { get; set; } = new();
    public List<MonthlyCashFlowRowDto> MonthlyCashFlow { get; set; } = new();
    public List<object> RecentReceipts { get; set; } = new();
    public List<object> RecentPayments { get; set; } = new();
}

public class CashFlowModeSummaryDto
{
    public string PaymentMode { get; set; } = string.Empty;
    public decimal Inflow { get; set; }
    public decimal Outflow { get; set; }
    public decimal NetFlow { get; set; }
}

public class MonthlyCashFlowRowDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty;
    public decimal Inflow { get; set; }
    public decimal Outflow { get; set; }
    public decimal NetCashFlow { get; set; }
}

// 9. Receivables
public class ReceivablesReportSummaryDto
{
    public int TotalInvoices { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal TotalBilled { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal CollectionRatePercent { get; set; }
    public decimal Bucket0To30Days { get; set; }
    public decimal Bucket31To60Days { get; set; }
    public decimal Bucket61To90Days { get; set; }
    public decimal BucketOver90Days { get; set; }
    public List<PartyBalanceSummaryDto> ByBuyer { get; set; } = new();
}

public class ReceivableRowDto
{
    public string SourceType { get; set; } = "Sale";
    public string ReferenceNo { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Party { get; set; } = string.Empty;
    public string Farm { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal CollectedAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int DaysOutstanding { get; set; }
    public string AgingBucket { get; set; } = "0-30 days";
}

// 10. Payables
public class PayablesReportSummaryDto
{
    public int TotalPayableItems { get; set; }
    public decimal PurchasePayables { get; set; }
    public decimal SupplierLedgerPayables { get; set; }
    public decimal ExpensePayables { get; set; }
    public decimal LabourUnpaidWages { get; set; }
    public decimal LoanOutstandingPrincipal { get; set; }
    public decimal TotalPayables { get; set; }
    public decimal Bucket0To30Days { get; set; }
    public decimal Bucket31To60Days { get; set; }
    public decimal Bucket61To90Days { get; set; }
    public decimal BucketOver90Days { get; set; }
    public List<PartyBalanceSummaryDto> ByParty { get; set; } = new();
}

public class PayableRowDto
{
    public string SourceType { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Party { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int DaysPending { get; set; }
    public string AgingBucket { get; set; } = "0-30 days";
}

public class PartyBalanceSummaryDto
{
    public string Party { get; set; } = string.Empty;
    public int RecordCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal SettledAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
}

// =========================================================================
// B. AGRICULTURE REPORTS (11 - 21)
// =========================================================================

// 11. Crop-wise Income
public class CropIncomeSummaryDto
{
    public int TotalCrops { get; set; }
    public decimal TotalSalesRevenue { get; set; }
    public decimal TotalOtherIncome { get; set; }
    public decimal TotalIncome { get; set; }
    public string TopCrop { get; set; } = string.Empty;
}

public class CropIncomeRowDto
{
    public string Crop { get; set; } = string.Empty;
    public int SalesCount { get; set; }
    public decimal SalesRevenue { get; set; }
    public decimal TotalQuantitySold { get; set; }
    public int OtherIncomeCount { get; set; }
    public decimal OtherIncome { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal SharePercent { get; set; }
}

// 12. Crop-wise Expense
public class CropExpenseSummaryDto
{
    public int TotalCrops { get; set; }
    public decimal TotalOperatingExpenses { get; set; }
    public decimal TotalLabourCost { get; set; }
    public decimal TotalInputPurchases { get; set; }
    public decimal TotalActivityCost { get; set; }
    public decimal TotalExpense { get; set; }
    public string HighestCostCrop { get; set; } = string.Empty;
}

public class CropExpenseRowDto
{
    public string Crop { get; set; } = string.Empty;
    public decimal OperatingExpenses { get; set; }
    public decimal LabourCost { get; set; }
    public decimal InputPurchases { get; set; }
    public decimal ActivityCost { get; set; }
    public int TransactionCount { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal SharePercent { get; set; }
}

// 13. Crop-wise Profit (also preserves Revenue/Expenses/NetProfit/ProfitMarginPercent)
public class CropProfitRowDto
{
    public string Crop { get; set; } = string.Empty;
    public decimal SalesRevenue { get; set; }
    public decimal OtherIncome { get; set; }
    public decimal Revenue { get; set; }
    public decimal OperatingExpenses { get; set; }
    public decimal LabourCost { get; set; }
    public decimal InputPurchases { get; set; }
    public decimal ActivityCost { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitMarginPercent { get; set; }
    public decimal AreaAcres { get; set; }
}

// 14. Farm-wise Profit (also preserves Farm/Revenue/Expenses/NetProfit/ProfitMarginPercent)
public class FarmProfitRowDto
{
    public int? FarmId { get; set; }
    public string Farm { get; set; } = string.Empty;
    public decimal AreaAcres { get; set; }
    public decimal SalesRevenue { get; set; }
    public decimal OtherIncome { get; set; }
    public decimal Revenue { get; set; }
    public decimal OperatingExpenses { get; set; }
    public decimal LabourCost { get; set; }
    public decimal InputPurchases { get; set; }
    public decimal ActivityCost { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitMarginPercent { get; set; }
}

// 15. Season-wise Profit
public class SeasonProfitSummaryDto
{
    public int TotalSeasons { get; set; }
    public decimal TotalAreaAcres { get; set; }
    public decimal TotalExpectedRevenue { get; set; }
    public decimal TotalActualRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalNetProfit { get; set; }
    public decimal OverallMarginPercent { get; set; }
}

public class SeasonProfitRowDto
{
    public int SeasonId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string CropName { get; set; } = string.Empty;
    public DateTime SowingDate { get; set; }
    public DateTime? HarvestDate { get; set; }
    public decimal AreaAcres { get; set; }
    public decimal ExpectedRevenue { get; set; }
    public decimal ActualRevenue { get; set; }
    public decimal OperatingExpenses { get; set; }
    public decimal LabourCost { get; set; }
    public decimal InputPurchases { get; set; }
    public decimal ActivityCost { get; set; }
    public decimal TotalCost { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitMarginPercent { get; set; }
    public string Status { get; set; } = string.Empty;
}

// 16. Acre-wise Cost & 17. Acre-wise Revenue
public class AcreMetricSummaryDto
{
    public decimal TotalAreaAcres { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AveragePerAcre { get; set; }
    public int GroupCount { get; set; }
}

public class AcreCostRowDto
{
    public string GroupType { get; set; } = "Farm";
    public string Name { get; set; } = string.Empty;
    public decimal AreaAcres { get; set; }
    public decimal OperatingCost { get; set; }
    public decimal LabourCost { get; set; }
    public decimal InputCost { get; set; }
    public decimal ActivityCost { get; set; }
    public decimal TotalCost { get; set; }
    public decimal CostPerAcre { get; set; }
}

public class AcreRevenueRowDto
{
    public string GroupType { get; set; } = "Farm";
    public string Name { get; set; } = string.Empty;
    public decimal AreaAcres { get; set; }
    public decimal SalesRevenue { get; set; }
    public decimal OtherIncome { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal RevenuePerAcre { get; set; }
    public decimal SoldQuantity { get; set; }
    public decimal YieldPerAcre { get; set; }
}

// 18. Yield Report
public class YieldReportSummaryDto
{
    public int TotalCropSeasons { get; set; }
    public decimal TotalAreaAcres { get; set; }
    public decimal TotalExpectedYield { get; set; }
    public decimal TotalActualYield { get; set; }
    public decimal TotalSoldQuantity { get; set; }
    public decimal OverallAchievementPercent { get; set; }
    public decimal AverageYieldPerAcre { get; set; }
}

public class YieldReportRowDto
{
    public int SeasonId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string CropName { get; set; } = string.Empty;
    public string Unit { get; set; } = "Bags";
    public decimal AreaAcres { get; set; }
    public decimal ExpectedYield { get; set; }
    public decimal ActualYield { get; set; }
    public decimal SoldQuantity { get; set; }
    public decimal YieldVariance { get; set; }
    public decimal YieldAchievementPercent { get; set; }
    public decimal YieldPerAcre { get; set; }
    public string Status { get; set; } = string.Empty;
}

// 19. Labour Cost Report
public class LabourCostReportDto
{
    public int TotalWorkers { get; set; }
    public int ActiveWorkers { get; set; }
    public int TotalAttendanceEntries { get; set; }
    public decimal TotalUnitsWorked { get; set; }
    public decimal TotalCalculatedWages { get; set; }
    public decimal TotalPaidWages { get; set; }
    public decimal OutstandingWages { get; set; }
    public decimal DirectLabourExpenses { get; set; }
    public List<LabourWorkerSummaryDto> ByWorker { get; set; } = new();
    public List<CategoryBreakdownDto> ByWorkType { get; set; } = new();
    public List<CategoryBreakdownDto> ByFarm { get; set; } = new();
    public List<CategoryBreakdownDto> ByCrop { get; set; } = new();
}

public class LabourWorkerSummaryDto
{
    public ulong LabourId { get; set; }
    public string LabourCode { get; set; } = string.Empty;
    public string LabourName { get; set; } = string.Empty;
    public decimal DailyRate { get; set; }
    public int AttendanceDays { get; set; }
    public decimal TotalUnitsWorked { get; set; }
    public decimal EarnedWages { get; set; }
    public decimal PaidWages { get; set; }
    public decimal BalanceWages { get; set; }
    public string Status { get; set; } = string.Empty;
}

// 20. Input Cost Report
public class InputCostReportDto
{
    public decimal TotalPurchaseInputCost { get; set; }
    public decimal TotalDirectInputExpenses { get; set; }
    public decimal TotalStockConsumptionCost { get; set; }
    public decimal TotalInputCost { get; set; }
    public int PurchaseOrdersCount { get; set; }
    public int DirectExpenseCount { get; set; }
    public int ConsumptionEventsCount { get; set; }
    public List<CategoryBreakdownDto> ByCategory { get; set; } = new();
    public List<CategoryBreakdownDto> ByProduct { get; set; } = new();
    public List<CategoryBreakdownDto> BySupplier { get; set; } = new();
    public List<CategoryBreakdownDto> ByCrop { get; set; } = new();
    public List<CategoryBreakdownDto> ByFarm { get; set; } = new();
}

// 21. Machinery Cost Report
public class MachineryCostReportDto
{
    public int TotalMachines { get; set; }
    public int ActiveMachines { get; set; }
    public decimal TotalFleetPurchaseCost { get; set; }
    public decimal TotalFleetCurrentValue { get; set; }
    public decimal TotalMachineryOperatingCost { get; set; }
    public decimal TotalDirectMachineryExpenses { get; set; }
    public decimal TotalCombinedMachineryCost { get; set; }
    public int ExpenseEntriesCount { get; set; }
    public List<MachineryCostBreakdownDto> ByMachine { get; set; } = new();
    public List<CategoryBreakdownDto> ByExpenseType { get; set; } = new();
    public List<MachineryExpenseRowDto> Expenses { get; set; } = new();
}

public class MachineryCostBreakdownDto
{
    public int? MachineryId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public string MachineType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal PurchaseCost { get; set; }
    public decimal CurrentValue { get; set; }
    public int ExpenseCount { get; set; }
    public decimal TotalOperatingCost { get; set; }
    public decimal CostToPurchaseRatioPercent { get; set; }
}

public class MachineryExpenseRowDto
{
    public int Id { get; set; }
    public int? MachineryId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public string ExpenseType { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
}

// =========================================================================
// C. INVENTORY REPORTS (22 - 26)
// =========================================================================

// 22. Stock Report
public class StockReportSummaryDto
{
    public int TotalRecords { get; set; }
    public int DistinctProducts { get; set; }
    public int DistinctLocations { get; set; }
    public decimal TotalCurrentStock { get; set; }
    public decimal TotalReservedStock { get; set; }
    public decimal TotalStockValuation { get; set; }
    public int InStockCount { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public List<CategoryBreakdownDto> ByCategory { get; set; } = new();
    public List<CategoryBreakdownDto> ByLocation { get; set; } = new();
}

public class StockReportRowDto
{
    public int InventoryId { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReservedStock { get; set; }
    public decimal AvailableStock { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal StandardCost { get; set; }
    public decimal StockValue { get; set; }
    public string StockStatus { get; set; } = "In Stock";
    public DateTime LastUpdated { get; set; }
}

// 23. Stock Ledger Report
public class StockLedgerReportSummaryDto
{
    public int TotalEntries { get; set; }
    public decimal TotalStockInQty { get; set; }
    public decimal TotalStockOutQty { get; set; }
    public decimal TotalAdjustmentDeltaQty { get; set; }
    public decimal TotalInwardValue { get; set; }
    public decimal TotalOutwardValue { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class StockLedgerReportRowDto
{
    public long Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public decimal BalanceAfterTransaction { get; set; }
    public string StorageLocation { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

// 24. Purchase Report
public class PurchaseReportSummaryDto
{
    public int TotalOrders { get; set; }
    public decimal TotalSubTotal { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalBalance { get; set; }
    public List<CategoryBreakdownDto> BySupplier { get; set; } = new();
    public List<CategoryBreakdownDto> ByMonth { get; set; } = new();
}

public class PurchaseReportRowDto
{
    public long Id { get; set; }
    public string PurchaseNo { get; set; } = string.Empty;
    public DateTime PurchaseDate { get; set; }
    public long SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string? FarmName { get; set; }
    public string? CropName { get; set; }
    public int ItemCount { get; set; }
    public string ItemsSummary { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

// 25. Consumption Report
public class ConsumptionReportSummaryDto
{
    public int TotalEvents { get; set; }
    public int DistinctProducts { get; set; }
    public decimal TotalConsumedQuantity { get; set; }
    public decimal TotalConsumptionValue { get; set; }
    public List<CategoryBreakdownDto> ByProduct { get; set; } = new();
    public List<CategoryBreakdownDto> ByCategory { get; set; } = new();
    public List<CategoryBreakdownDto> ByLocation { get; set; } = new();
}

public class ConsumptionReportRowDto
{
    public long TransactionId { get; set; }
    public DateTime Date { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal ConsumedQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalValue { get; set; }
    public string StorageLocation { get; set; } = string.Empty;
    public string? ReferenceType { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Farm { get; set; }
    public string? Crop { get; set; }
    public string? Notes { get; set; }
}

// 26. Low Stock Report
public class LowStockReportSummaryDto
{
    public int TotalLowStockItems { get; set; }
    public int OutOfStockCount { get; set; }
    public int CriticalLowCount { get; set; }
    public int LowStockCount { get; set; }
    public decimal TotalDeficitQuantity { get; set; }
    public decimal TotalEstimatedReorderCost { get; set; }
}

public class LowStockReportRowDto
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal DeficitQuantity { get; set; }
    public decimal StandardCost { get; set; }
    public decimal EstimatedReorderCost { get; set; }
    public decimal HealthPercent { get; set; }
    public string Severity { get; set; } = "Low Stock";
}
