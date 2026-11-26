using AgriMan.Unified.Api.DTOs.Crops;
using AgriMan.Unified.Api.Services.Crops;
using FarmManagementApi.DTOs.Reports;
using FarmManagementApi.Services.Reports;
using Microsoft.AspNetCore.Mvc;

namespace FarmManagementApi.Controllers;

/// <summary>
/// Module 19 - Reports Module: Comprehensive Financial, Agriculture, and Inventory Reports + CSV Export,
/// plus Crop Profitability &amp; Unit Economics endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;
    private readonly ICropProfitabilityService _cropProfitability;

    public ReportsController(
        IReportsService reportsService,
        ICropProfitabilityService cropProfitability)
    {
        _reportsService = reportsService;
        _cropProfitability = cropProfitability;
    }

    // =========================================================================
    // CATALOG & UNIFIED EXPORT
    // =========================================================================

    /// <summary>
    /// List all 26 available reports in Module 19 with their endpoints and descriptions.
    /// </summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(List<ReportCatalogItemDto>), StatusCodes.Status200OK)]
    public IActionResult GetCatalog()
    {
        return Ok(_reportsService.GetCatalog());
    }

    /// <summary>
    /// Export any Module 19 report as a UTF-8 CSV file by report key (e.g. daily-income, pnl, receivables, crop-profit, stock, low-stock).
    /// </summary>
    [HttpGet("export/{reportKey}")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportCsv(string reportKey, [FromQuery] ReportQueryParameters query)
    {
        var exported = await _reportsService.ExportReportCsvAsync(reportKey, query);
        if (exported == null)
        {
            return NotFound(new { message = $"Unknown report key '{reportKey}'. Call GET /api/Reports/catalog for valid keys." });
        }

        return File(exported.Value.Content, "text/csv", exported.Value.FileName);
    }

    // =========================================================================
    // A. FINANCIAL REPORTS (1 - 10)
    // =========================================================================

    /// <summary>1. Daily Income Report (Crop Sales + Farm Income grouped by day).</summary>
    [HttpGet("daily-income")]
    [HttpGet("financial/daily-income")]
    [ProducesResponseType(typeof(ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyIncome([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetDailyIncomeReportAsync(query));

    /// <summary>2. Daily Expense Report (Operating expenses, labour, machinery, and input purchases grouped by day).</summary>
    [HttpGet("daily-expense")]
    [HttpGet("financial/daily-expense")]
    [ProducesResponseType(typeof(ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyExpense([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetDailyExpenseReportAsync(query));

    /// <summary>3. Monthly Income Report with month-over-month growth.</summary>
    [HttpGet("monthly-income")]
    [HttpGet("financial/monthly-income")]
    [ProducesResponseType(typeof(ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyIncome([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetMonthlyIncomeReportAsync(query));

    /// <summary>4. Monthly Expense Report with month-over-month change.</summary>
    [HttpGet("monthly-expense")]
    [HttpGet("financial/monthly-expense")]
    [ProducesResponseType(typeof(ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyExpense([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetMonthlyExpenseReportAsync(query));

    /// <summary>5. Annual Income Report with year-over-year growth and top crop/farm.</summary>
    [HttpGet("annual-income")]
    [HttpGet("financial/annual-income")]
    [ProducesResponseType(typeof(ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnualIncome([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetAnnualIncomeReportAsync(query));

    /// <summary>6. Annual Expense Report with year-over-year comparison and top category.</summary>
    [HttpGet("annual-expense")]
    [HttpGet("financial/annual-expense")]
    [ProducesResponseType(typeof(ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnualExpense([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetAnnualExpenseReportAsync(query));

    /// <summary>7. Profit &amp; Loss Statement (supports both /pnl and /financial/profit-loss).</summary>
    [HttpGet("pnl")]
    [HttpGet("financial/profit-loss")]
    [ProducesResponseType(typeof(ProfitAndLossReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfitAndLoss([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetProfitAndLossReportAsync(query));

    /// <summary>8. Cash Flow Report (supports both /cash-flow and /financial/cash-flow).</summary>
    [HttpGet("cash-flow")]
    [HttpGet("financial/cash-flow")]
    [ProducesResponseType(typeof(CashFlowReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCashFlow([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetCashFlowReportAsync(query));

    /// <summary>9. Receivables Report with aging buckets and buyer breakdown.</summary>
    [HttpGet("receivables")]
    [HttpGet("financial/receivables")]
    [ProducesResponseType(typeof(ReportResponse<ReceivablesReportSummaryDto, ReceivableRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReceivables([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetReceivablesReportAsync(query));

    /// <summary>10. Payables Report (Purchases, Supplier Ledger, Expenses, Labour, and Loans) with aging buckets.</summary>
    [HttpGet("payables")]
    [HttpGet("financial/payables")]
    [ProducesResponseType(typeof(ReportResponse<PayablesReportSummaryDto, PayableRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayables([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetPayablesReportAsync(query));

    // =========================================================================
    // B. AGRICULTURE REPORTS (11 - 21)
    // =========================================================================

    /// <summary>11. Crop-wise Income Report.</summary>
    [HttpGet("crop-income")]
    [HttpGet("agriculture/crop-income")]
    [ProducesResponseType(typeof(ReportResponse<CropIncomeSummaryDto, CropIncomeRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCropIncome([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetCropIncomeReportAsync(query));

    /// <summary>12. Crop-wise Expense Report.</summary>
    [HttpGet("crop-expense")]
    [HttpGet("agriculture/crop-expense")]
    [ProducesResponseType(typeof(ReportResponse<CropExpenseSummaryDto, CropExpenseRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCropExpense([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetCropExpenseReportAsync(query));

    /// <summary>13. Crop-wise Profit Report (supports both /crop-profit and /agriculture/crop-profit).</summary>
    [HttpGet("crop-profit")]
    [HttpGet("agriculture/crop-profit")]
    [ProducesResponseType(typeof(List<CropProfitRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCropProfit([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetCropProfitReportAsync(query));

    /// <summary>13b. Crop-wise P&amp;L &amp; Unit Economics overview (supports /crop-wise-pnl and /crop-profitability).</summary>
    [HttpGet("crop-wise-pnl")]
    [HttpGet("crop-profitability")]
    [ProducesResponseType(typeof(CropProfitabilityOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCropProfitability(
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        var overview = await _cropProfitability.GetAllCropsProfitabilityAsync(parameters, cancellationToken);
        return Ok(overview);
    }

    /// <summary>13c. Crop-wise P&amp;L &amp; Unit Economics for a specific crop name.</summary>
    [HttpGet("crop-profitability/{cropName}")]
    [ProducesResponseType(typeof(CropProfitabilityItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCropProfitabilityByName(
        string cropName,
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cropName))
        {
            return BadRequest(new { message = "Crop name is required." });
        }

        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        var item = await _cropProfitability.GetCropProfitabilityByNameAsync(cropName, parameters, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"No crop profitability data found for '{cropName.Trim()}'." });
        }

        return Ok(item);
    }

    /// <summary>14. Farm-wise Profit Report (supports both /farm-profit and /agriculture/farm-profit).</summary>
    [HttpGet("farm-profit")]
    [HttpGet("agriculture/farm-profit")]
    [ProducesResponseType(typeof(List<FarmProfitRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFarmProfit([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetFarmProfitReportAsync(query));

    /// <summary>15. Season-wise Profit Report across crop seasons.</summary>
    [HttpGet("season-profit")]
    [HttpGet("agriculture/season-profit")]
    [ProducesResponseType(typeof(ReportResponse<SeasonProfitSummaryDto, SeasonProfitRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSeasonProfit([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetSeasonProfitReportAsync(query));

    /// <summary>16. Acre-wise Cost Report normalized per acre across farms and crops.</summary>
    [HttpGet("acre-cost")]
    [HttpGet("agriculture/acre-cost")]
    [ProducesResponseType(typeof(ReportResponse<AcreMetricSummaryDto, AcreCostRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAcreCost([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetAcreCostReportAsync(query));

    /// <summary>17. Acre-wise Revenue Report normalized per acre across farms and crops.</summary>
    [HttpGet("acre-revenue")]
    [HttpGet("agriculture/acre-revenue")]
    [ProducesResponseType(typeof(ReportResponse<AcreMetricSummaryDto, AcreRevenueRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAcreRevenue([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetAcreRevenueReportAsync(query));

    /// <summary>18. Crop Yield Report comparing expected vs. actual yield and sold quantity.</summary>
    [HttpGet("yield")]
    [HttpGet("agriculture/yield")]
    [ProducesResponseType(typeof(ReportResponse<YieldReportSummaryDto, YieldReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetYield([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetYieldReportAsync(query));

    /// <summary>19. Labour Cost Report (wages earned vs. paid, work type, farm, and crop breakdown).</summary>
    [HttpGet("labour-cost")]
    [HttpGet("agriculture/labour-cost")]
    [ProducesResponseType(typeof(LabourCostReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLabourCost([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetLabourCostReportAsync(query));

    /// <summary>20. Input Cost Report (purchases, direct input expenses, and stock consumption).</summary>
    [HttpGet("input-cost")]
    [HttpGet("agriculture/input-cost")]
    [ProducesResponseType(typeof(InputCostReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInputCost([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetInputCostReportAsync(query));

    /// <summary>21. Machinery Cost Report (fleet values and operating expenses by machine and type).</summary>
    [HttpGet("machinery-cost")]
    [HttpGet("agriculture/machinery-cost")]
    [ProducesResponseType(typeof(MachineryCostReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMachineryCost([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetMachineryCostReportAsync(query));

    // =========================================================================
    // C. INVENTORY REPORTS (22 - 26)
    // =========================================================================

    /// <summary>22. Inventory Stock Report (current/reserved/available stock and valuation).</summary>
    [HttpGet("stock")]
    [HttpGet("inventory/stock")]
    [ProducesResponseType(typeof(ReportResponse<StockReportSummaryDto, StockReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockReport([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetStockReportAsync(query));

    /// <summary>23. Stock Ledger Report (paginated movement audit trail with running balance).</summary>
    [HttpGet("stock-ledger")]
    [HttpGet("inventory/stock-ledger")]
    [ProducesResponseType(typeof(ReportResponse<StockLedgerReportSummaryDto, StockLedgerReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockLedgerReport([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetStockLedgerReportAsync(query));

    /// <summary>24. Purchase Report (input purchase orders, supplier totals, and balance due).</summary>
    [HttpGet("purchases")]
    [HttpGet("inventory/purchases")]
    [ProducesResponseType(typeof(ReportResponse<PurchaseReportSummaryDto, PurchaseReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPurchaseReport([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetPurchaseReportAsync(query));

    /// <summary>25. Consumption Report (stock-out and field consumption quantities and cost).</summary>
    [HttpGet("consumption")]
    [HttpGet("inventory/consumption")]
    [ProducesResponseType(typeof(ReportResponse<ConsumptionReportSummaryDto, ConsumptionReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConsumptionReport([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetConsumptionReportAsync(query));

    /// <summary>26. Low Stock Report (below-reorder items, deficit quantity, and estimated reorder cost).</summary>
    [HttpGet("low-stock")]
    [HttpGet("inventory/low-stock")]
    [ProducesResponseType(typeof(ReportResponse<LowStockReportSummaryDto, LowStockReportRowDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockReport([FromQuery] ReportQueryParameters query) =>
        Ok(await _reportsService.GetLowStockReportAsync(query));
}
