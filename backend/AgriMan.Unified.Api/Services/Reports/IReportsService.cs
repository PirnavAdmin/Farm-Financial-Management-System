using FarmManagementApi.DTOs.Reports;

namespace FarmManagementApi.Services.Reports;

public interface IReportsService
{
    List<ReportCatalogItemDto> GetCatalog();

    // Financial Reports (1-10)
    Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetDailyIncomeReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetDailyExpenseReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetMonthlyIncomeReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetMonthlyExpenseReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetAnnualIncomeReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetAnnualExpenseReportAsync(ReportQueryParameters query);
    Task<ProfitAndLossReportDto> GetProfitAndLossReportAsync(ReportQueryParameters query);
    Task<CashFlowReportDto> GetCashFlowReportAsync(ReportQueryParameters query);
    Task<ReportResponse<ReceivablesReportSummaryDto, ReceivableRowDto>> GetReceivablesReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PayablesReportSummaryDto, PayableRowDto>> GetPayablesReportAsync(ReportQueryParameters query);

    // Agriculture Reports (11-21)
    Task<ReportResponse<CropIncomeSummaryDto, CropIncomeRowDto>> GetCropIncomeReportAsync(ReportQueryParameters query);
    Task<ReportResponse<CropExpenseSummaryDto, CropExpenseRowDto>> GetCropExpenseReportAsync(ReportQueryParameters query);
    Task<List<CropProfitRowDto>> GetCropProfitReportAsync(ReportQueryParameters query);
    Task<List<FarmProfitRowDto>> GetFarmProfitReportAsync(ReportQueryParameters query);
    Task<ReportResponse<SeasonProfitSummaryDto, SeasonProfitRowDto>> GetSeasonProfitReportAsync(ReportQueryParameters query);
    Task<ReportResponse<AcreMetricSummaryDto, AcreCostRowDto>> GetAcreCostReportAsync(ReportQueryParameters query);
    Task<ReportResponse<AcreMetricSummaryDto, AcreRevenueRowDto>> GetAcreRevenueReportAsync(ReportQueryParameters query);
    Task<ReportResponse<YieldReportSummaryDto, YieldReportRowDto>> GetYieldReportAsync(ReportQueryParameters query);
    Task<LabourCostReportDto> GetLabourCostReportAsync(ReportQueryParameters query);
    Task<InputCostReportDto> GetInputCostReportAsync(ReportQueryParameters query);
    Task<MachineryCostReportDto> GetMachineryCostReportAsync(ReportQueryParameters query);

    // Inventory Reports (22-26)
    Task<ReportResponse<StockReportSummaryDto, StockReportRowDto>> GetStockReportAsync(ReportQueryParameters query);
    Task<ReportResponse<StockLedgerReportSummaryDto, StockLedgerReportRowDto>> GetStockLedgerReportAsync(ReportQueryParameters query);
    Task<ReportResponse<PurchaseReportSummaryDto, PurchaseReportRowDto>> GetPurchaseReportAsync(ReportQueryParameters query);
    Task<ReportResponse<ConsumptionReportSummaryDto, ConsumptionReportRowDto>> GetConsumptionReportAsync(ReportQueryParameters query);
    Task<ReportResponse<LowStockReportSummaryDto, LowStockReportRowDto>> GetLowStockReportAsync(ReportQueryParameters query);

    // Unified CSV Export
    Task<(string FileName, byte[] Content)?> ExportReportCsvAsync(string reportKey, ReportQueryParameters query);
}
