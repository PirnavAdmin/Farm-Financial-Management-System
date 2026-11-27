using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AgriMan.Expenses.Api.Data;
using Agriman.Machinery.Api.Data;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;

namespace FarmManagementApi.Services.Reports;

public class ReportsService : IReportsService
{
    private readonly FarmDbContext _farmDb;
    private readonly ExpenseDbContext _expenseDb;
    private readonly SalesDbContext _salesDb;
    private readonly MachineryDbContext _machineryDb;

    public ReportsService(
        FarmDbContext farmDb,
        ExpenseDbContext expenseDb,
        SalesDbContext salesDb,
        MachineryDbContext machineryDb)
    {
        _farmDb = farmDb;
        _expenseDb = expenseDb;
        _salesDb = salesDb;
        _machineryDb = machineryDb;
    }

    public List<ReportCatalogItemDto> GetCatalog() => new()
    {
        // Financial Reports (1-10)
        CatalogItem("daily-income", "Financial Reports", "Daily Income Report", "/api/Reports/financial/daily-income", "Day-by-day crop sales and farm income summary."),
        CatalogItem("daily-expense", "Financial Reports", "Daily Expense Report", "/api/Reports/financial/daily-expense", "Day-by-day operating expenses, wages, machinery, and input purchases."),
        CatalogItem("monthly-income", "Financial Reports", "Monthly Income Report", "/api/Reports/financial/monthly-income", "Monthly income totals with month-over-month growth."),
        CatalogItem("monthly-expense", "Financial Reports", "Monthly Expense Report", "/api/Reports/financial/monthly-expense", "Monthly expenditure totals with month-over-month change."),
        CatalogItem("annual-income", "Financial Reports", "Annual Income Report", "/api/Reports/financial/annual-income", "Yearly revenue totals with year-over-year growth and top performers."),
        CatalogItem("annual-expense", "Financial Reports", "Annual Expense Report", "/api/Reports/financial/annual-expense", "Yearly expenditure totals with year-over-year comparison."),
        CatalogItem("pnl", "Financial Reports", "Profit & Loss", "/api/Reports/financial/profit-loss", "Income statement summarizing revenue, costs, net profit, and margins."),
        CatalogItem("cash-flow", "Financial Reports", "Cash Flow", "/api/Reports/financial/cash-flow", "Cash inflows vs. outflows across payment modes and months."),
        CatalogItem("receivables", "Financial Reports", "Receivables", "/api/Reports/financial/receivables", "Outstanding customer/buyer receivables with aging buckets."),
        CatalogItem("payables", "Financial Reports", "Payables", "/api/Reports/financial/payables", "Outstanding supplier, purchase, expense, labour, and loan payables."),

        // Agriculture Reports (11-21)
        CatalogItem("crop-income", "Agriculture Reports", "Crop-wise Income", "/api/Reports/agriculture/crop-income", "Revenue generated per crop across sales and farm income."),
        CatalogItem("crop-expense", "Agriculture Reports", "Crop-wise Expense", "/api/Reports/agriculture/crop-expense", "Operating, labour, input, and activity costs per crop."),
        CatalogItem("crop-profit", "Agriculture Reports", "Crop-wise Profit", "/api/Reports/agriculture/crop-profit", "Revenue, cost, net profit, and margin per crop."),
        CatalogItem("farm-profit", "Agriculture Reports", "Farm-wise Profit", "/api/Reports/agriculture/farm-profit", "Revenue, cost, net profit, and margin per farm."),
        CatalogItem("season-profit", "Agriculture Reports", "Season-wise Profit", "/api/Reports/agriculture/season-profit", "Profitability across crop seasons and sowing-to-harvest windows."),
        CatalogItem("acre-cost", "Agriculture Reports", "Acre-wise Cost", "/api/Reports/agriculture/acre-cost", "Cost per acre normalized across farm land and crop seasons."),
        CatalogItem("acre-revenue", "Agriculture Reports", "Acre-wise Revenue", "/api/Reports/agriculture/acre-revenue", "Revenue and yield per acre across farms and crops."),
        CatalogItem("yield", "Agriculture Reports", "Yield Report", "/api/Reports/agriculture/yield", "Expected vs. actual harvest yield and sold quantities."),
        CatalogItem("labour-cost", "Agriculture Reports", "Labour Cost Report", "/api/Reports/agriculture/labour-cost", "Worker wages earned vs. paid, work types, and farm/crop breakdown."),
        CatalogItem("input-cost", "Agriculture Reports", "Input Cost Report", "/api/Reports/agriculture/input-cost", "Seeds, fertilizers, pesticides, and stock consumption costs."),
        CatalogItem("machinery-cost", "Agriculture Reports", "Machinery Cost Report", "/api/Reports/agriculture/machinery-cost", "Fleet valuation, fuel, maintenance, repair, and operator costs."),

        // Inventory Reports (22-26)
        CatalogItem("stock", "Inventory Reports", "Stock Report", "/api/Reports/inventory/stock", "Current stock levels, reserved stock, and inventory valuation."),
        CatalogItem("stock-ledger", "Inventory Reports", "Stock Ledger", "/api/Reports/inventory/stock-ledger", "Chronological stock movement audit trail with running balances."),
        CatalogItem("purchases", "Inventory Reports", "Purchase Report", "/api/Reports/inventory/purchases", "Agricultural input purchase orders, taxes, and payment balances."),
        CatalogItem("consumption", "Inventory Reports", "Consumption Report", "/api/Reports/inventory/consumption", "Stock-out and field input consumption quantities and values."),
        CatalogItem("low-stock", "Inventory Reports", "Low Stock Report", "/api/Reports/inventory/low-stock", "Items at or below reorder threshold with deficit and reorder cost.")
    };

    private static ReportCatalogItemDto CatalogItem(string key, string category, string name, string endpoint, string description) => new()
    {
        Key = key,
        Category = category,
        Name = name,
        Endpoint = endpoint,
        ExportEndpoint = $"/api/Reports/export/{key}",
        Description = description
    };

    // =========================================================================
    // SHARED HELPERS
    // =========================================================================

    private static (DateTime? From, DateTime? To) NormalizeDateRange(ReportQueryParameters query)
    {
        DateTime? from = query.FromDate;
        DateTime? to = query.ToDate;

        if (query.Date.HasValue)
        {
            from ??= query.Date.Value.Date;
            to ??= query.Date.Value.Date.AddDays(1).AddTicks(-1);
        }

        if (query.Year.HasValue && query.Year.Value > 0)
        {
            var y = query.Year.Value;
            if (query.Month.HasValue && query.Month.Value is >= 1 and <= 12)
            {
                var start = new DateTime(y, query.Month.Value, 1);
                var end = start.AddMonths(1).AddTicks(-1);
                from ??= start;
                to ??= end;
            }
            else
            {
                from ??= new DateTime(y, 1, 1);
                to ??= new DateTime(y, 12, 31, 23, 59, 59);
            }
        }

        if (to.HasValue && to.Value.TimeOfDay == TimeSpan.Zero)
        {
            to = to.Value.Date.AddDays(1).AddTicks(-1);
        }

        return (from, to);
    }

    private static bool IsNotCancelled(string? status) =>
        !string.Equals(status?.Trim(), "Cancelled", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(status?.Trim(), "Canceled", StringComparison.OrdinalIgnoreCase);

    private static bool IsPaidStatus(string? status) =>
        string.Equals(status?.Trim(), "Paid", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status?.Trim(), "Completed", StringComparison.OrdinalIgnoreCase);

    private static bool IsSettledCashStatus(string? status) =>
        string.IsNullOrWhiteSpace(status) ||
        string.Equals(status.Trim(), "Completed", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status.Trim(), "Paid", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status.Trim(), "Received", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status.Trim(), "Success", StringComparison.OrdinalIgnoreCase);

    private static bool MatchesFilter(string? value, string? filter) =>
        string.IsNullOrWhiteSpace(filter) ||
        filter.Equals("All", StringComparison.OrdinalIgnoreCase) ||
        (!string.IsNullOrWhiteSpace(value) && value.Contains(filter.Trim(), StringComparison.OrdinalIgnoreCase));

    private static string NormalizeKey(string? value, string fallback = "Unassigned") =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static decimal ConvertToAcres(decimal area, string? unit)
    {
        if (area <= 0) return 0m;
        var u = (unit ?? "Acres").Trim().ToLowerInvariant();
        return u switch
        {
            "hectare" or "hectares" or "ha" => Math.Round(area * 2.47105m, 2),
            "cent" or "cents" => Math.Round(area / 100m, 2),
            "guntha" or "gunthas" => Math.Round(area / 40m, 2),
            "square feet" or "sqft" or "sq.ft" => Math.Round(area / 43560m, 4),
            _ => Math.Round(area, 2)
        };
    }

    private static string AgingBucketForDays(int days) => days switch
    {
        <= 30 => "0-30 days",
        <= 60 => "31-60 days",
        <= 90 => "61-90 days",
        _ => "90+ days"
    };

    private static decimal SafePercent(decimal part, decimal total) =>
        total > 0 ? Math.Round((part / total) * 100m, 2) : 0m;

    private static string? ExtractTag(string? notes, string tag)
    {
        if (string.IsNullOrWhiteSpace(notes)) return null;
        var match = Regex.Match(notes, $@"\[{Regex.Escape(tag)}:\s*([^\]]+)\]", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Trim() : null;
    }

    private static bool IsInputExpenseCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return false;
        var c = category.ToLowerInvariant();
        return c.Contains("seed") || c.Contains("fertil") || c.Contains("pestic") ||
               c.Contains("chemical") || c.Contains("input") || c.Contains("nutrient") ||
               c.Contains("irrigation") || c.Contains("water");
    }

    private static bool IsLabourExpenseCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return false;
        var c = category.ToLowerInvariant();
        return c.Contains("labour") || c.Contains("labor") || c.Contains("wage");
    }

    private static bool IsMachineryExpenseCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return false;
        var c = category.ToLowerInvariant();
        return c.Contains("machinery") || c.Contains("equipment") || c.Contains("fuel") || c.Contains("diesel");
    }

    // =========================================================================
    // A. FINANCIAL REPORTS (1 - 10)
    // =========================================================================

    public Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetDailyIncomeReportAsync(ReportQueryParameters query) =>
        BuildPeriodIncomeAsync("daily-income", "Daily Income Report", "day", query);

    public Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetMonthlyIncomeReportAsync(ReportQueryParameters query) =>
        BuildPeriodIncomeAsync("monthly-income", "Monthly Income Report", "month", query);

    public Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> GetAnnualIncomeReportAsync(ReportQueryParameters query) =>
        BuildPeriodIncomeAsync("annual-income", "Annual Income Report", "year", query);

    private async Task<ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>> BuildPeriodIncomeAsync(
        string reportKey, string reportTitle, string granularity, ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var salesQuery = _salesDb.Sales.AsNoTracking().AsQueryable();
        var incomeQuery = _farmDb.IncomeTransactions.Include(i => i.Category).AsNoTracking().AsQueryable();

        if (from.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate >= from.Value);
            incomeQuery = incomeQuery.Where(i => i.IncomeDate >= from.Value);
        }
        if (to.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate <= to.Value);
            incomeQuery = incomeQuery.Where(i => i.IncomeDate <= to.Value);
        }

        var sales = (await salesQuery.ToListAsync())
            .Where(s => MatchesFilter(s.Farm, query.Farm) && MatchesFilter(s.Crop, query.Crop) &&
                        MatchesFilter(s.Buyer, query.Party) && MatchesFilter(s.PaymentStatus, query.Status) &&
                        (string.IsNullOrWhiteSpace(query.Search) ||
                         s.SalesNo.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                         s.Buyer.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                         s.Crop.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var incomes = (await incomeQuery.ToListAsync())
            .Where(i => IsNotCancelled(i.Status) &&
                        MatchesFilter(i.Farm, query.Farm) && MatchesFilter(i.Crop, query.Crop) &&
                        MatchesFilter(i.Category?.Name, query.Category) && MatchesFilter(i.Buyer, query.Party) &&
                        MatchesFilter(i.Status, query.Status) &&
                        (string.IsNullOrWhiteSpace(query.Search) ||
                         i.IncomeNo.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                         i.Buyer.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
                         (i.Crop ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        string FormatKey(DateTime d) => granularity switch
        {
            "day" => d.ToString("yyyy-MM-dd"),
            "month" => d.ToString("yyyy-MM"),
            _ => d.ToString("yyyy")
        };

        string FormatLabel(DateTime d) => granularity switch
        {
            "day" => d.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            "month" => d.ToString("MMM yyyy", CultureInfo.InvariantCulture),
            _ => d.ToString("yyyy", CultureInfo.InvariantCulture)
        };

        var entries = new List<(DateTime Date, string Key, string Label, bool IsSale, decimal Gross, decimal Net, string Crop, string Farm)>();

        foreach (var s in sales)
        {
            entries.Add((s.SalesDate, FormatKey(s.SalesDate), FormatLabel(s.SalesDate), true, s.GrossAmount, s.NetAmount, s.Crop, s.Farm));
        }
        foreach (var i in incomes)
        {
            entries.Add((i.IncomeDate, FormatKey(i.IncomeDate), FormatLabel(i.IncomeDate), false, i.GrossAmount, i.NetAmount, i.Crop ?? string.Empty, i.Farm));
        }

        var grouped = entries
            .GroupBy(e => e.Key)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var first = g.First();
                var topCrop = g.Where(x => !string.IsNullOrWhiteSpace(x.Crop))
                    .GroupBy(x => x.Crop, StringComparer.OrdinalIgnoreCase)
                    .OrderByDescending(cg => cg.Sum(x => x.Net))
                    .Select(cg => cg.Key)
                    .FirstOrDefault();

                var topFarm = g.Where(x => !string.IsNullOrWhiteSpace(x.Farm))
                    .GroupBy(x => x.Farm, StringComparer.OrdinalIgnoreCase)
                    .OrderByDescending(fg => fg.Sum(x => x.Net))
                    .Select(fg => fg.Key)
                    .FirstOrDefault();

                return new PeriodIncomeRowDto
                {
                    PeriodKey = g.Key,
                    PeriodLabel = first.Label,
                    Year = first.Date.Year,
                    Month = granularity == "year" ? null : first.Date.Month,
                    CropSalesCount = g.Count(x => x.IsSale),
                    CropSalesRevenue = Math.Round(g.Where(x => x.IsSale).Sum(x => x.Net), 2),
                    OtherIncomeCount = g.Count(x => !x.IsSale),
                    OtherIncome = Math.Round(g.Where(x => !x.IsSale).Sum(x => x.Net), 2),
                    TotalTransactions = g.Count(),
                    GrossAmount = Math.Round(g.Sum(x => x.Gross), 2),
                    NetAmount = Math.Round(g.Sum(x => x.Net), 2),
                    TopCrop = topCrop,
                    TopFarm = topFarm
                };
            })
            .ToList();

        for (int idx = 1; idx < grouped.Count; idx++)
        {
            var prev = grouped[idx - 1].NetAmount;
            grouped[idx].GrowthPercent = prev > 0 ? Math.Round(((grouped[idx].NetAmount - prev) / prev) * 100m, 2) : null;
        }

        var orderedRows = grouped.OrderByDescending(r => r.PeriodKey).ToList();
        var peak = orderedRows.OrderByDescending(r => r.NetAmount).FirstOrDefault();
        var totalNet = Math.Round(orderedRows.Sum(r => r.NetAmount), 2);

        return new ReportResponse<PeriodIncomeSummaryDto, PeriodIncomeRowDto>
        {
            ReportKey = reportKey,
            ReportTitle = reportTitle,
            Filters = query,
            Summary = new PeriodIncomeSummaryDto
            {
                TotalCropSalesRevenue = Math.Round(orderedRows.Sum(r => r.CropSalesRevenue), 2),
                TotalOtherIncome = Math.Round(orderedRows.Sum(r => r.OtherIncome), 2),
                TotalGrossIncome = Math.Round(orderedRows.Sum(r => r.GrossAmount), 2),
                TotalNetIncome = totalNet,
                TotalTransactions = orderedRows.Sum(r => r.TotalTransactions),
                PeriodCount = orderedRows.Count,
                AveragePerPeriod = orderedRows.Count > 0 ? Math.Round(totalNet / orderedRows.Count, 2) : 0m,
                PeakPeriod = peak?.PeriodLabel ?? "—",
                PeakAmount = peak?.NetAmount ?? 0m
            },
            Rows = orderedRows
        };
    }

    public Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetDailyExpenseReportAsync(ReportQueryParameters query) =>
        BuildPeriodExpenseAsync("daily-expense", "Daily Expense Report", "day", query);

    public Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetMonthlyExpenseReportAsync(ReportQueryParameters query) =>
        BuildPeriodExpenseAsync("monthly-expense", "Monthly Expense Report", "month", query);

    public Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> GetAnnualExpenseReportAsync(ReportQueryParameters query) =>
        BuildPeriodExpenseAsync("annual-expense", "Annual Expense Report", "year", query);

    private async Task<ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>> BuildPeriodExpenseAsync(
        string reportKey, string reportTitle, string granularity, ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var expQuery = _expenseDb.ExpenseTransactions.AsNoTracking().AsQueryable();
        var labourQuery = _farmDb.LabourPayments.AsNoTracking().AsQueryable();
        var machQuery = _machineryDb.MachineryExpenses.AsNoTracking().AsQueryable();
        var purchaseQuery = _farmDb.Purchases.AsNoTracking().AsQueryable();

        if (from.HasValue)
        {
            expQuery = expQuery.Where(e => e.ExpenseDate >= from.Value);
            labourQuery = labourQuery.Where(l => l.PaymentDate >= from.Value);
            machQuery = machQuery.Where(m => m.Date >= from.Value);
            purchaseQuery = purchaseQuery.Where(p => p.PurchaseDate >= from.Value);
        }
        if (to.HasValue)
        {
            expQuery = expQuery.Where(e => e.ExpenseDate <= to.Value);
            labourQuery = labourQuery.Where(l => l.PaymentDate <= to.Value);
            machQuery = machQuery.Where(m => m.Date <= to.Value);
            purchaseQuery = purchaseQuery.Where(p => p.PurchaseDate <= to.Value);
        }

        var farmLookup = await _farmDb.Farms.AsNoTracking().ToDictionaryAsync(f => (long)f.Id, f => f.FarmName);
        var cropLookup = await _farmDb.Crops.AsNoTracking().ToDictionaryAsync(c => (long)c.Id, c => c.CropName);

        var expenses = (await expQuery.ToListAsync())
            .Where(e => IsNotCancelled(e.Status) &&
                        MatchesFilter(e.Farm, query.Farm) &&
                        MatchesFilter(e.Crop, query.Crop) &&
                        MatchesFilter(e.ExpenseCategory, query.Category) &&
                        MatchesFilter(e.Supplier, query.Party))
            .ToList();

        // LabourPayments, MachineryExpenses, and Purchases are included unless filtered out by incompatible dimension
        var includeLabour = string.IsNullOrWhiteSpace(query.Category) || IsLabourExpenseCategory(query.Category);
        var includeMachinery = string.IsNullOrWhiteSpace(query.Category) || IsMachineryExpenseCategory(query.Category);
        var includePurchases = string.IsNullOrWhiteSpace(query.Category) || IsInputExpenseCategory(query.Category);

        var labourPayments = includeLabour && string.IsNullOrWhiteSpace(query.Farm) && string.IsNullOrWhiteSpace(query.Crop)
            ? await labourQuery.ToListAsync()
            : new();

        var machineryExpenses = includeMachinery && string.IsNullOrWhiteSpace(query.Farm) && string.IsNullOrWhiteSpace(query.Crop)
            ? (await machQuery.ToListAsync()).Where(m => MatchesFilter(m.ExpenseType, query.Category)).ToList()
            : new();

        var purchases = includePurchases
            ? (await purchaseQuery.ToListAsync()).Where(p =>
                MatchesFilter(p.FarmId.HasValue && farmLookup.TryGetValue(p.FarmId.Value, out var fn) ? fn : null, query.Farm) &&
                MatchesFilter(p.CropId.HasValue && cropLookup.TryGetValue(p.CropId.Value, out var cn) ? cn : null, query.Crop))
                .ToList()
            : new();

        string FormatKey(DateTime d) => granularity switch
        {
            "day" => d.ToString("yyyy-MM-dd"),
            "month" => d.ToString("yyyy-MM"),
            _ => d.ToString("yyyy")
        };

        string FormatLabel(DateTime d) => granularity switch
        {
            "day" => d.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            "month" => d.ToString("MMM yyyy", CultureInfo.InvariantCulture),
            _ => d.ToString("yyyy", CultureInfo.InvariantCulture)
        };

        var items = new List<(DateTime Date, string Key, string Label, string Source, string Category, decimal Amount)>();
        foreach (var e in expenses)
            items.Add((e.ExpenseDate, FormatKey(e.ExpenseDate), FormatLabel(e.ExpenseDate), "Operating", e.ExpenseCategory, e.Amount));
        foreach (var l in labourPayments)
            items.Add((l.PaymentDate, FormatKey(l.PaymentDate), FormatLabel(l.PaymentDate), "Labour", "Labour Wages", l.AmountPaid));
        foreach (var m in machineryExpenses)
            items.Add((m.Date, FormatKey(m.Date), FormatLabel(m.Date), "Machinery", $"Machinery - {m.ExpenseType}", m.Amount));
        foreach (var p in purchases)
            items.Add((p.PurchaseDate, FormatKey(p.PurchaseDate), FormatLabel(p.PurchaseDate), "Purchase", "Input Purchases", p.TotalAmount));

        var grouped = items
            .GroupBy(i => i.Key)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var first = g.First();
                var topCat = g.GroupBy(x => x.Category, StringComparer.OrdinalIgnoreCase)
                    .OrderByDescending(cg => cg.Sum(x => x.Amount))
                    .Select(cg => cg.Key)
                    .FirstOrDefault();

                var op = g.Where(x => x.Source == "Operating").Sum(x => x.Amount);
                var lab = g.Where(x => x.Source == "Labour").Sum(x => x.Amount);
                var mach = g.Where(x => x.Source == "Machinery").Sum(x => x.Amount);
                var pur = g.Where(x => x.Source == "Purchase").Sum(x => x.Amount);

                return new PeriodExpenseRowDto
                {
                    PeriodKey = g.Key,
                    PeriodLabel = first.Label,
                    Year = first.Date.Year,
                    Month = granularity == "year" ? null : first.Date.Month,
                    OperatingExpenses = Math.Round(op, 2),
                    LabourWages = Math.Round(lab, 2),
                    MachineryExpenses = Math.Round(mach, 2),
                    InputPurchases = Math.Round(pur, 2),
                    TotalTransactions = g.Count(),
                    TotalExpense = Math.Round(op + lab + mach + pur, 2),
                    TopCategory = topCat
                };
            })
            .ToList();

        for (int idx = 1; idx < grouped.Count; idx++)
        {
            var prev = grouped[idx - 1].TotalExpense;
            grouped[idx].ChangePercent = prev > 0 ? Math.Round(((grouped[idx].TotalExpense - prev) / prev) * 100m, 2) : null;
        }

        var orderedRows = grouped.OrderByDescending(r => r.PeriodKey).ToList();
        var peak = orderedRows.OrderByDescending(r => r.TotalExpense).FirstOrDefault();
        var total = Math.Round(orderedRows.Sum(r => r.TotalExpense), 2);

        return new ReportResponse<PeriodExpenseSummaryDto, PeriodExpenseRowDto>
        {
            ReportKey = reportKey,
            ReportTitle = reportTitle,
            Filters = query,
            Summary = new PeriodExpenseSummaryDto
            {
                TotalOperatingExpenses = Math.Round(orderedRows.Sum(r => r.OperatingExpenses), 2),
                TotalLabourWages = Math.Round(orderedRows.Sum(r => r.LabourWages), 2),
                TotalMachineryExpenses = Math.Round(orderedRows.Sum(r => r.MachineryExpenses), 2),
                TotalInputPurchases = Math.Round(orderedRows.Sum(r => r.InputPurchases), 2),
                TotalExpense = total,
                TotalTransactions = orderedRows.Sum(r => r.TotalTransactions),
                PeriodCount = orderedRows.Count,
                AveragePerPeriod = orderedRows.Count > 0 ? Math.Round(total / orderedRows.Count, 2) : 0m,
                PeakPeriod = peak?.PeriodLabel ?? "—",
                PeakAmount = peak?.TotalExpense ?? 0m
            },
            Rows = orderedRows
        };
    }

    public async Task<ProfitAndLossReportDto> GetProfitAndLossReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var salesQuery = _salesDb.Sales.AsNoTracking().AsQueryable();
        var incomeQuery = _farmDb.IncomeTransactions.Include(i => i.Category).AsNoTracking().AsQueryable();
        var expenseQuery = _expenseDb.ExpenseTransactions.AsNoTracking().AsQueryable();
        var labourQuery = _farmDb.LabourPayments.AsNoTracking().AsQueryable();
        var machQuery = _machineryDb.MachineryExpenses.AsNoTracking().AsQueryable();
        var purchaseQuery = _farmDb.Purchases.AsNoTracking().AsQueryable();
        var loanPayQuery = _farmDb.LoanPayments.AsNoTracking().AsQueryable();

        if (from.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate >= from.Value);
            incomeQuery = incomeQuery.Where(i => i.IncomeDate >= from.Value);
            expenseQuery = expenseQuery.Where(e => e.ExpenseDate >= from.Value);
            labourQuery = labourQuery.Where(l => l.PaymentDate >= from.Value);
            machQuery = machQuery.Where(m => m.Date >= from.Value);
            purchaseQuery = purchaseQuery.Where(p => p.PurchaseDate >= from.Value);
            loanPayQuery = loanPayQuery.Where(lp => lp.PaymentDate >= from.Value);
        }
        if (to.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate <= to.Value);
            incomeQuery = incomeQuery.Where(i => i.IncomeDate <= to.Value);
            expenseQuery = expenseQuery.Where(e => e.ExpenseDate <= to.Value);
            labourQuery = labourQuery.Where(l => l.PaymentDate <= to.Value);
            machQuery = machQuery.Where(m => m.Date <= to.Value);
            purchaseQuery = purchaseQuery.Where(p => p.PurchaseDate <= to.Value);
            loanPayQuery = loanPayQuery.Where(lp => lp.PaymentDate <= to.Value);
        }

        var sales = (await salesQuery.ToListAsync())
            .Where(s => MatchesFilter(s.Farm, query.Farm) && MatchesFilter(s.Crop, query.Crop)).ToList();
        var incomes = (await incomeQuery.ToListAsync())
            .Where(i => IsNotCancelled(i.Status) && MatchesFilter(i.Farm, query.Farm) && MatchesFilter(i.Crop, query.Crop)).ToList();
        var expenses = (await expenseQuery.ToListAsync())
            .Where(e => IsNotCancelled(e.Status) && MatchesFilter(e.Farm, query.Farm) && MatchesFilter(e.Crop, query.Crop)).ToList();

        var hasDimFilter = !string.IsNullOrWhiteSpace(query.Farm) || !string.IsNullOrWhiteSpace(query.Crop);
        var labourPayments = hasDimFilter ? new() : await labourQuery.ToListAsync();
        var machExpenses = hasDimFilter ? new() : await machQuery.ToListAsync();
        var purchases = hasDimFilter ? new() : await purchaseQuery.ToListAsync();
        var loanPayments = hasDimFilter ? new() : await loanPayQuery.ToListAsync();

        var totalSales = Math.Round(sales.Sum(s => s.NetAmount), 2);
        var otherIncome = Math.Round(incomes.Sum(i => i.NetAmount), 2);
        var totalRevenue = Math.Round(totalSales + otherIncome, 2);

        var opExp = Math.Round(expenses.Sum(e => e.Amount), 2);
        var labWages = Math.Round(labourPayments.Sum(l => l.AmountPaid), 2);
        var machCost = Math.Round(machExpenses.Sum(m => m.Amount), 2);
        var inputPurchases = Math.Round(purchases.Sum(p => p.TotalAmount), 2);
        var loanInterest = Math.Round(loanPayments.Sum(lp => lp.Interest + lp.Penalty), 2);
        var totalExpenses = Math.Round(opExp + labWages + machCost + inputPurchases + loanInterest, 2);

        var netProfit = Math.Round(totalRevenue - totalExpenses, 2);

        var incomeCategories = new List<CategoryBreakdownDto>();
        if (totalSales > 0)
        {
            incomeCategories.Add(new CategoryBreakdownDto
            {
                Category = "Crop Sales",
                Count = sales.Count,
                Amount = totalSales,
                SharePercent = SafePercent(totalSales, totalRevenue)
            });
        }
        incomeCategories.AddRange(incomes
            .GroupBy(i => i.Category?.Name ?? "Other Farm Income")
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.NetAmount), 2);
                return new CategoryBreakdownDto
                {
                    Category = g.Key,
                    Count = g.Count(),
                    Amount = amt,
                    SharePercent = SafePercent(amt, totalRevenue)
                };
            }));

        var expenseCategories = expenses
            .GroupBy(e => NormalizeKey(e.ExpenseCategory, "Miscellaneous"))
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.Amount), 2);
                return new CategoryBreakdownDto
                {
                    Category = g.Key,
                    Count = g.Count(),
                    Amount = amt,
                    SharePercent = SafePercent(amt, totalExpenses)
                };
            })
            .ToList();

        if (labWages > 0)
            expenseCategories.Add(new CategoryBreakdownDto { Category = "Labour Wages (Payroll)", Count = labourPayments.Count, Amount = labWages, SharePercent = SafePercent(labWages, totalExpenses) });
        if (machCost > 0)
            expenseCategories.Add(new CategoryBreakdownDto { Category = "Machinery Operations", Count = machExpenses.Count, Amount = machCost, SharePercent = SafePercent(machCost, totalExpenses) });
        if (inputPurchases > 0)
            expenseCategories.Add(new CategoryBreakdownDto { Category = "Input Purchases", Count = purchases.Count, Amount = inputPurchases, SharePercent = SafePercent(inputPurchases, totalExpenses) });
        if (loanInterest > 0)
            expenseCategories.Add(new CategoryBreakdownDto { Category = "Loan Interest & Penalties", Count = loanPayments.Count, Amount = loanInterest, SharePercent = SafePercent(loanInterest, totalExpenses) });

        var monthlyRev = sales.Select(s => (s.SalesDate, s.NetAmount))
            .Concat(incomes.Select(i => (i.IncomeDate, i.NetAmount)))
            .GroupBy(x => new { x.Item1.Year, x.Item1.Month })
            .ToDictionary(g => (g.Key.Year, g.Key.Month), g => g.Sum(x => x.NetAmount));

        var monthlyExp = expenses.Select(e => (e.ExpenseDate, e.Amount))
            .Concat(labourPayments.Select(l => (l.PaymentDate, l.AmountPaid)))
            .Concat(machExpenses.Select(m => (m.Date, m.Amount)))
            .Concat(purchases.Select(p => (p.PurchaseDate, p.TotalAmount)))
            .Concat(loanPayments.Select(lp => (lp.PaymentDate, lp.Interest + lp.Penalty)))
            .GroupBy(x => new { x.Item1.Year, x.Item1.Month })
            .ToDictionary(g => (g.Key.Year, g.Key.Month), g => g.Sum(x => x.Item2));

        var trend = monthlyRev.Keys.Union(monthlyExp.Keys)
            .OrderBy(k => k.Year).ThenBy(k => k.Month)
            .Select(k =>
            {
                var r = Math.Round(monthlyRev.GetValueOrDefault(k, 0m), 2);
                var e = Math.Round(monthlyExp.GetValueOrDefault(k, 0m), 2);
                return new MonthlyPnlRowDto
                {
                    Year = k.Year,
                    Month = k.Month,
                    MonthLabel = new DateTime(k.Year, k.Month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    Revenue = r,
                    Expenses = e,
                    NetProfit = Math.Round(r - e, 2)
                };
            })
            .ToList();

        return new ProfitAndLossReportDto
        {
            TotalRevenue = totalRevenue,
            CropSalesRevenue = totalSales,
            OtherFarmIncome = otherIncome,
            TotalExpenses = totalExpenses,
            OperatingExpenses = opExp,
            LabourWages = labWages,
            MachineryExpenses = machCost,
            InputPurchases = inputPurchases,
            LoanInterestPaid = loanInterest,
            NetProfit = netProfit,
            ProfitMarginPercent = SafePercent(netProfit, totalRevenue),
            Period = new { From = from, To = to },
            IncomeByCategory = incomeCategories.OrderByDescending(c => c.Amount).ToList(),
            ExpenseByCategory = expenseCategories.OrderByDescending(c => c.Amount).ToList(),
            MonthlyTrend = trend
        };
    }

    public async Task<CashFlowReportDto> GetCashFlowReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var finReceipts = await _farmDb.FinanceReceipts.AsNoTracking().ToListAsync();
        var salesPayments = await _salesDb.SalesPayments.AsNoTracking().ToListAsync();
        var incomePayments = await _farmDb.IncomePayments.AsNoTracking().ToListAsync();

        var finPayments = await _farmDb.FinancePayments.AsNoTracking().ToListAsync();
        var expPayments = await _expenseDb.ExpensePayments.AsNoTracking().ToListAsync();
        var supPayments = await _farmDb.SupplierPayments.AsNoTracking().ToListAsync();
        var purPayments = await _farmDb.PurchasePayments.AsNoTracking().ToListAsync();
        var labPayments = await _farmDb.LabourPayments.AsNoTracking().ToListAsync();
        var loanPayments = await _farmDb.LoanPayments.AsNoTracking().ToListAsync();

        bool InRange(DateTime d) => (!from.HasValue || d >= from.Value) && (!to.HasValue || d <= to.Value);

        var fRec = finReceipts.Where(r => InRange(r.Date) && IsSettledCashStatus(r.Status)).ToList();
        var sPay = salesPayments.Where(p => InRange(p.PaymentDate)).ToList();
        var iPay = incomePayments.Where(p => InRange(p.PaymentDate)).ToList();

        var fPay = finPayments.Where(p => InRange(p.Date) && IsSettledCashStatus(p.Status)).ToList();
        var ePay = expPayments.Where(p => InRange(p.PaymentDate) && IsNotCancelled(p.Status)).ToList();
        var spPay = supPayments.Where(p => InRange(p.PaymentDate)).ToList();
        var puPay = purPayments.Where(p => InRange(p.PaymentDate)).ToList();
        var lbPay = labPayments.Where(p => InRange(p.PaymentDate)).ToList();
        var lnPay = loanPayments.Where(p => InRange(p.PaymentDate)).ToList();

        static decimal EffectiveReceiptAmount(FarmManagementApi.Models.FinanceReceipt r) =>
            r.FinalAmount > 0m ? r.FinalAmount : Math.Max(0m, Math.Round(r.Amount - r.Discount + r.OtherCharges, 2));

        static decimal EffectivePaymentAmount(FarmManagementApi.Models.FinancePayment p) =>
            p.TotalAmount > 0m ? p.TotalAmount : Math.Max(0m, Math.Round(p.Amount + p.AdditionalCharges - p.Discount, 2));

        var inflows = new List<(DateTime Date, string Mode, decimal Amount, object Raw)>();
        inflows.AddRange(fRec.Select(r =>
        {
            var net = EffectiveReceiptAmount(r);
            return (r.Date, NormalizeKey(r.PaymentMode, "Bank"), net, (object)new { r.Id, VoucherNo = r.ReceiptNo, r.Date, Party = r.From, r.PaymentMode, Amount = net, Source = "FinanceReceipt" });
        }));
        inflows.AddRange(sPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Bank"), p.PaymentAmount, (object)new { p.Id, VoucherNo = p.PaymentNo, Date = p.PaymentDate, Party = p.Buyer, p.PaymentMode, Amount = p.PaymentAmount, Source = "SalesPayment" })));
        inflows.AddRange(iPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Cash"), p.Amount, (object)new { p.Id, VoucherNo = $"INC-PAY-{p.Id}", Date = p.PaymentDate, Party = p.BankOrCash ?? "Farm Income", p.PaymentMode, p.Amount, Source = "IncomePayment" })));

        var outflows = new List<(DateTime Date, string Mode, decimal Amount, object Raw)>();
        outflows.AddRange(fPay.Select(p =>
        {
            var net = EffectivePaymentAmount(p);
            return (p.Date, NormalizeKey(p.PaymentMode, "Bank"), net, (object)new { p.Id, VoucherNo = p.PaymentNo, p.Date, p.Party, p.PaymentMode, Amount = net, Source = "FinancePayment" });
        }));
        outflows.AddRange(ePay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Cash"), p.Amount, (object)new { p.Id, VoucherNo = $"EXP-PAY-{p.Id}", Date = p.PaymentDate, Party = p.BankOrCash, p.PaymentMode, p.Amount, Source = "ExpensePayment" })));
        outflows.AddRange(spPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Bank"), p.AmountPaid, (object)new { p.Id, VoucherNo = p.PaymentCode, Date = p.PaymentDate, Party = p.SupplierName, p.PaymentMode, Amount = p.AmountPaid, Source = "SupplierPayment" })));
        outflows.AddRange(puPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Cash"), p.Amount, (object)new { p.Id, VoucherNo = $"PUR-PAY-{p.Id}", Date = p.PaymentDate, Party = p.BankOrCash, p.PaymentMode, p.Amount, Source = "PurchasePayment" })));
        outflows.AddRange(lbPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Cash"), p.AmountPaid, (object)new { p.Id, VoucherNo = p.PaymentCode, Date = p.PaymentDate, Party = $"Labour #{p.LabourId}", p.PaymentMode, Amount = p.AmountPaid, Source = "LabourPayment" })));
        outflows.AddRange(lnPay.Select(p => (p.PaymentDate, NormalizeKey(p.PaymentMode, "Bank"), p.TotalPayment, (object)new { p.Id, VoucherNo = p.VoucherNo, Date = p.PaymentDate, Party = $"Loan #{p.LoanId}", p.PaymentMode, Amount = p.TotalPayment, Source = "LoanPayment" })));

        var totalIn = Math.Round(inflows.Sum(x => x.Amount), 2);
        var totalOut = Math.Round(outflows.Sum(x => x.Amount), 2);

        var modes = inflows.Select(x => x.Mode).Union(outflows.Select(x => x.Mode), StringComparer.OrdinalIgnoreCase)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(m =>
            {
                var iAmt = Math.Round(inflows.Where(x => x.Mode.Equals(m, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount), 2);
                var oAmt = Math.Round(outflows.Where(x => x.Mode.Equals(m, StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount), 2);
                return new CashFlowModeSummaryDto { PaymentMode = m, Inflow = iAmt, Outflow = oAmt, NetFlow = Math.Round(iAmt - oAmt, 2) };
            })
            .OrderByDescending(m => m.Inflow + m.Outflow)
            .ToList();

        var monthKeys = inflows.Select(x => (x.Date.Year, x.Date.Month))
            .Union(outflows.Select(x => (x.Date.Year, x.Date.Month)))
            .Distinct()
            .OrderBy(k => k.Year).ThenBy(k => k.Month)
            .ToList();

        var monthly = monthKeys.Select(k =>
        {
            var iAmt = Math.Round(inflows.Where(x => x.Date.Year == k.Year && x.Date.Month == k.Month).Sum(x => x.Amount), 2);
            var oAmt = Math.Round(outflows.Where(x => x.Date.Year == k.Year && x.Date.Month == k.Month).Sum(x => x.Amount), 2);
            return new MonthlyCashFlowRowDto
            {
                Year = k.Year,
                Month = k.Month,
                MonthLabel = new DateTime(k.Year, k.Month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Inflow = iAmt,
                Outflow = oAmt,
                NetCashFlow = Math.Round(iAmt - oAmt, 2)
            };
        }).ToList();

        return new CashFlowReportDto
        {
            TotalCashInflow = totalIn,
            TotalCashOutflow = totalOut,
            NetCashFlow = Math.Round(totalIn - totalOut, 2),
            FinanceReceiptsInflow = Math.Round(fRec.Sum(EffectiveReceiptAmount), 2),
            SalesCollectionsInflow = Math.Round(sPay.Sum(x => x.PaymentAmount), 2),
            IncomePaymentsInflow = Math.Round(iPay.Sum(x => x.Amount), 2),
            FinancePaymentsOutflow = Math.Round(fPay.Sum(EffectivePaymentAmount), 2),
            ExpensePaymentsOutflow = Math.Round(ePay.Sum(x => x.Amount), 2),
            SupplierPaymentsOutflow = Math.Round(spPay.Sum(x => x.AmountPaid), 2),
            PurchasePaymentsOutflow = Math.Round(puPay.Sum(x => x.Amount), 2),
            LabourPaymentsOutflow = Math.Round(lbPay.Sum(x => x.AmountPaid), 2),
            LoanPaymentsOutflow = Math.Round(lnPay.Sum(x => x.TotalPayment), 2),
            ByPaymentMode = modes,
            MonthlyCashFlow = monthly,
            RecentReceipts = inflows.OrderByDescending(x => x.Date).Take(10).Select(x => x.Raw).ToList(),
            RecentPayments = outflows.OrderByDescending(x => x.Date).Take(10).Select(x => x.Raw).ToList()
        };
    }

    public async Task<ReportResponse<ReceivablesReportSummaryDto, ReceivableRowDto>> GetReceivablesReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);
        var today = DateTime.UtcNow.Date;

        var sales = await _salesDb.Sales.AsNoTracking().ToListAsync();
        var salesPayments = await _salesDb.SalesPayments.AsNoTracking().ToListAsync();
        var incomes = await _farmDb.IncomeTransactions.Include(i => i.Payments).AsNoTracking().ToListAsync();

        var rows = new List<ReceivableRowDto>();

        foreach (var s in sales)
        {
            var paid = salesPayments
                .Where(p => p.SaleId == s.Id || p.SalesNo.Equals(s.SalesNo, StringComparison.OrdinalIgnoreCase))
                .Sum(p => p.PaymentAmount);

            var effectivePaid = IsPaidStatus(s.PaymentStatus) && paid <= 0m
                ? s.NetAmount
                : Math.Min(s.NetAmount, Math.Max(0m, paid));
            var balance = Math.Round(Math.Max(0m, s.NetAmount - effectivePaid), 2);
            var days = Math.Max(0, (today - s.SalesDate.Date).Days);

            rows.Add(new ReceivableRowDto
            {
                SourceType = "Sale",
                ReferenceNo = s.SalesNo,
                Date = s.SalesDate,
                Party = s.Buyer,
                Farm = s.Farm,
                Crop = s.Crop,
                TotalAmount = Math.Round(s.NetAmount, 2),
                CollectedAmount = Math.Round(effectivePaid, 2),
                BalanceAmount = balance,
                Status = balance <= 0 ? "Paid" : (effectivePaid > 0 ? "Partially Paid" : "Pending"),
                DaysOutstanding = balance > 0 ? days : 0,
                AgingBucket = balance > 0 ? AgingBucketForDays(days) : "Settled"
            });
        }

        foreach (var inc in incomes.Where(i => IsNotCancelled(i.Status)))
        {
            var paid = inc.Payments.Sum(p => p.Amount);
            var effectivePaid = IsPaidStatus(inc.Status) && paid <= 0m
                ? inc.NetAmount
                : Math.Min(inc.NetAmount, Math.Max(0m, paid));
            var balance = Math.Round(Math.Max(0m, inc.NetAmount - effectivePaid), 2);
            if (balance <= 0m && IsPaidStatus(inc.Status)) continue;

            var days = Math.Max(0, (today - inc.IncomeDate.Date).Days);
            rows.Add(new ReceivableRowDto
            {
                SourceType = "Income",
                ReferenceNo = inc.IncomeNo,
                Date = inc.IncomeDate,
                Party = inc.Buyer,
                Farm = inc.Farm,
                Crop = inc.Crop ?? string.Empty,
                TotalAmount = Math.Round(inc.NetAmount, 2),
                CollectedAmount = Math.Round(effectivePaid, 2),
                BalanceAmount = balance,
                Status = balance <= 0 ? "Paid" : (effectivePaid > 0 ? "Partially Paid" : "Pending"),
                DaysOutstanding = balance > 0 ? days : 0,
                AgingBucket = balance > 0 ? AgingBucketForDays(days) : "Settled"
            });
        }

        var filtered = rows.Where(r =>
            (!from.HasValue || r.Date >= from.Value) &&
            (!to.HasValue || r.Date <= to.Value) &&
            MatchesFilter(r.Farm, query.Farm) &&
            MatchesFilter(r.Crop, query.Crop) &&
            MatchesFilter(r.Party, query.Party) &&
            MatchesFilter(r.Status, query.Status) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.ReferenceNo.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.Party.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(r => r.BalanceAmount)
            .ThenByDescending(r => r.Date)
            .ToList();

        var pending = filtered.Where(r => r.BalanceAmount > 0).ToList();
        var totalBilled = Math.Round(filtered.Sum(r => r.TotalAmount), 2);
        var totalCollected = Math.Round(filtered.Sum(r => r.CollectedAmount), 2);
        var totalOutstanding = Math.Round(filtered.Sum(r => r.BalanceAmount), 2);

        var byBuyer = filtered
            .GroupBy(r => NormalizeKey(r.Party, "Unknown Buyer"), StringComparer.OrdinalIgnoreCase)
            .Select(g => new PartyBalanceSummaryDto
            {
                Party = g.Key,
                RecordCount = g.Count(),
                TotalAmount = Math.Round(g.Sum(x => x.TotalAmount), 2),
                SettledAmount = Math.Round(g.Sum(x => x.CollectedAmount), 2),
                OutstandingAmount = Math.Round(g.Sum(x => x.BalanceAmount), 2)
            })
            .OrderByDescending(b => b.OutstandingAmount)
            .ToList();

        return new ReportResponse<ReceivablesReportSummaryDto, ReceivableRowDto>
        {
            ReportKey = "receivables",
            ReportTitle = "Receivables Report",
            Filters = query,
            Summary = new ReceivablesReportSummaryDto
            {
                TotalInvoices = filtered.Count,
                PendingInvoicesCount = pending.Count,
                TotalBilled = totalBilled,
                TotalCollected = totalCollected,
                TotalOutstanding = totalOutstanding,
                CollectionRatePercent = SafePercent(totalCollected, totalBilled),
                Bucket0To30Days = Math.Round(pending.Where(r => r.DaysOutstanding <= 30).Sum(r => r.BalanceAmount), 2),
                Bucket31To60Days = Math.Round(pending.Where(r => r.DaysOutstanding is > 30 and <= 60).Sum(r => r.BalanceAmount), 2),
                Bucket61To90Days = Math.Round(pending.Where(r => r.DaysOutstanding is > 60 and <= 90).Sum(r => r.BalanceAmount), 2),
                BucketOver90Days = Math.Round(pending.Where(r => r.DaysOutstanding > 90).Sum(r => r.BalanceAmount), 2),
                ByBuyer = byBuyer
            },
            Rows = filtered
        };
    }

    public async Task<ReportResponse<PayablesReportSummaryDto, PayableRowDto>> GetPayablesReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);
        var today = DateTime.UtcNow.Date;

        var purchases = await _farmDb.Purchases.Include(p => p.Supplier).AsNoTracking().ToListAsync();
        var supplierTx = await _farmDb.SupplierTransactions.AsNoTracking().ToListAsync();
        var expenses = await _expenseDb.ExpenseTransactions.Include(e => e.Payments).AsNoTracking().ToListAsync();
        var labours = await _farmDb.Labours.AsNoTracking().ToDictionaryAsync(l => l.Id, l => l.LabourName);
        var attendances = await _farmDb.LabourAttendances.AsNoTracking().ToListAsync();
        var labourPayments = await _farmDb.LabourPayments.AsNoTracking().ToListAsync();
        var loans = await _farmDb.Loans.AsNoTracking().ToListAsync();

        var rows = new List<PayableRowDto>();

        foreach (var p in purchases.Where(p => p.BalanceAmount > 0 && !IsPaidStatus(p.PaymentStatus)))
        {
            var days = Math.Max(0, (today - p.PurchaseDate.Date).Days);
            rows.Add(new PayableRowDto
            {
                SourceType = "Purchase",
                ReferenceNo = p.PurchaseNo,
                Date = p.PurchaseDate,
                Party = p.Supplier?.SupplierName ?? p.Supplier?.Name ?? $"Supplier #{p.SupplierId}",
                TotalAmount = Math.Round(p.TotalAmount, 2),
                PaidAmount = Math.Round(p.PaidAmount, 2),
                BalanceAmount = Math.Round(p.BalanceAmount, 2),
                Status = p.PaymentStatus,
                DaysPending = days,
                AgingBucket = AgingBucketForDays(days)
            });
        }

        foreach (var st in supplierTx.Where(t => t.BalanceAmount > 0 && !IsPaidStatus(t.PaymentStatus)))
        {
            var days = Math.Max(0, (today - st.TransactionDate.Date).Days);
            rows.Add(new PayableRowDto
            {
                SourceType = "SupplierLedger",
                ReferenceNo = st.TransactionCode,
                Date = st.TransactionDate,
                Party = st.SupplierName,
                TotalAmount = Math.Round(st.Amount, 2),
                PaidAmount = Math.Round(st.PaidAmount, 2),
                BalanceAmount = Math.Round(st.BalanceAmount, 2),
                Status = st.PaymentStatus,
                DaysPending = days,
                AgingBucket = AgingBucketForDays(days)
            });
        }

        foreach (var exp in expenses.Where(e => IsNotCancelled(e.Status) && !IsPaidStatus(e.Status)))
        {
            var paid = exp.Payments.Where(p => IsNotCancelled(p.Status)).Sum(p => p.Amount);
            var bal = Math.Round(Math.Max(0m, exp.Amount - paid), 2);
            if (bal <= 0) continue;
            var days = Math.Max(0, (today - exp.ExpenseDate.Date).Days);
            rows.Add(new PayableRowDto
            {
                SourceType = "Expense",
                ReferenceNo = exp.ExpenseNo,
                Date = exp.ExpenseDate,
                Party = exp.Supplier,
                TotalAmount = Math.Round(exp.Amount, 2),
                PaidAmount = Math.Round(paid, 2),
                BalanceAmount = bal,
                Status = exp.Status,
                DaysPending = days,
                AgingBucket = AgingBucketForDays(days)
            });
        }

        var labourIds = attendances.Select(a => a.LabourId).Distinct();
        foreach (var lid in labourIds)
        {
            var earned = attendances.Where(a => a.LabourId == lid).Sum(a => a.CalculatedAmount > 0 ? a.CalculatedAmount : a.Amount);
            var paid = labourPayments.Where(p => p.LabourId == lid).Sum(p => p.AmountPaid);
            var bal = Math.Round(Math.Max(0m, earned - paid), 2);
            if (bal <= 0) continue;
            var lastDate = attendances.Where(a => a.LabourId == lid).Max(a => a.AttendanceDate);
            var days = Math.Max(0, (today - lastDate.Date).Days);
            rows.Add(new PayableRowDto
            {
                SourceType = "Labour",
                ReferenceNo = $"LAB-{lid}",
                Date = lastDate,
                Party = labours.GetValueOrDefault(lid, $"Worker #{lid}"),
                TotalAmount = Math.Round(earned, 2),
                PaidAmount = Math.Round(paid, 2),
                BalanceAmount = bal,
                Status = "Pending",
                DaysPending = days,
                AgingBucket = AgingBucketForDays(days)
            });
        }

        foreach (var loan in loans.Where(l => l.OutstandingPrincipal > 0 && !string.Equals(l.Status, "Closed", StringComparison.OrdinalIgnoreCase)))
        {
            var days = Math.Max(0, (today - loan.StartDate.Date).Days);
            rows.Add(new PayableRowDto
            {
                SourceType = "Loan",
                ReferenceNo = loan.LoanNo,
                Date = loan.StartDate,
                Party = loan.BankLender,
                TotalAmount = Math.Round(loan.DisbursedAmount > 0 ? loan.DisbursedAmount : loan.SanctionAmount, 2),
                PaidAmount = Math.Round(Math.Max(0m, (loan.DisbursedAmount > 0 ? loan.DisbursedAmount : loan.SanctionAmount) - loan.OutstandingPrincipal), 2),
                BalanceAmount = Math.Round(loan.OutstandingPrincipal, 2),
                Status = loan.Status,
                DaysPending = days,
                AgingBucket = AgingBucketForDays(days)
            });
        }

        var filtered = rows.Where(r =>
            (!from.HasValue || r.Date >= from.Value) &&
            (!to.HasValue || r.Date <= to.Value) &&
            MatchesFilter(r.Party, query.Party) &&
            MatchesFilter(r.Status, query.Status) &&
            MatchesFilter(r.SourceType, query.Category) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.ReferenceNo.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.Party.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(r => r.BalanceAmount)
            .ToList();

        var byParty = filtered
            .GroupBy(r => NormalizeKey(r.Party, "Unknown Payee"), StringComparer.OrdinalIgnoreCase)
            .Select(g => new PartyBalanceSummaryDto
            {
                Party = g.Key,
                RecordCount = g.Count(),
                TotalAmount = Math.Round(g.Sum(x => x.TotalAmount), 2),
                SettledAmount = Math.Round(g.Sum(x => x.PaidAmount), 2),
                OutstandingAmount = Math.Round(g.Sum(x => x.BalanceAmount), 2)
            })
            .OrderByDescending(p => p.OutstandingAmount)
            .ToList();

        return new ReportResponse<PayablesReportSummaryDto, PayableRowDto>
        {
            ReportKey = "payables",
            ReportTitle = "Payables Report",
            Filters = query,
            Summary = new PayablesReportSummaryDto
            {
                TotalPayableItems = filtered.Count,
                PurchasePayables = Math.Round(filtered.Where(r => r.SourceType == "Purchase").Sum(r => r.BalanceAmount), 2),
                SupplierLedgerPayables = Math.Round(filtered.Where(r => r.SourceType == "SupplierLedger").Sum(r => r.BalanceAmount), 2),
                ExpensePayables = Math.Round(filtered.Where(r => r.SourceType == "Expense").Sum(r => r.BalanceAmount), 2),
                LabourUnpaidWages = Math.Round(filtered.Where(r => r.SourceType == "Labour").Sum(r => r.BalanceAmount), 2),
                LoanOutstandingPrincipal = Math.Round(filtered.Where(r => r.SourceType == "Loan").Sum(r => r.BalanceAmount), 2),
                TotalPayables = Math.Round(filtered.Sum(r => r.BalanceAmount), 2),
                Bucket0To30Days = Math.Round(filtered.Where(r => r.DaysPending <= 30).Sum(r => r.BalanceAmount), 2),
                Bucket31To60Days = Math.Round(filtered.Where(r => r.DaysPending is > 30 and <= 60).Sum(r => r.BalanceAmount), 2),
                Bucket61To90Days = Math.Round(filtered.Where(r => r.DaysPending is > 60 and <= 90).Sum(r => r.BalanceAmount), 2),
                BucketOver90Days = Math.Round(filtered.Where(r => r.DaysPending > 90).Sum(r => r.BalanceAmount), 2),
                ByParty = byParty
            },
            Rows = filtered
        };
    }

    // =========================================================================
    // B. AGRICULTURE REPORTS (11 - 21)
    // =========================================================================

    private sealed class AgriAggregateSnapshot
    {
        public List<CropProfitRowDto> Crops { get; init; } = new();
        public List<FarmProfitRowDto> Farms { get; init; } = new();
        public Dictionary<string, decimal> CropSoldQty { get; init; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, decimal> FarmSoldQty { get; init; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, int> CropIncomeTxCount { get; init; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, int> CropSalesTxCount { get; init; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, int> CropExpenseTxCount { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private async Task<AgriAggregateSnapshot> BuildAgriSnapshotAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var salesQ = _salesDb.Sales.AsNoTracking().AsQueryable();
        var incomeQ = _farmDb.IncomeTransactions.AsNoTracking().AsQueryable();
        var expenseQ = _expenseDb.ExpenseTransactions.AsNoTracking().AsQueryable();
        var labourQ = _farmDb.LabourAttendances.AsNoTracking().AsQueryable();
        var activityQ = _farmDb.CropActivities.AsNoTracking().AsQueryable();
        var purchaseQ = _farmDb.Purchases.AsNoTracking().AsQueryable();

        if (from.HasValue)
        {
            salesQ = salesQ.Where(x => x.SalesDate >= from.Value);
            incomeQ = incomeQ.Where(x => x.IncomeDate >= from.Value);
            expenseQ = expenseQ.Where(x => x.ExpenseDate >= from.Value);
            labourQ = labourQ.Where(x => x.AttendanceDate >= from.Value);
            activityQ = activityQ.Where(x => x.ActivityDate >= from.Value);
            purchaseQ = purchaseQ.Where(x => x.PurchaseDate >= from.Value);
        }
        if (to.HasValue)
        {
            salesQ = salesQ.Where(x => x.SalesDate <= to.Value);
            incomeQ = incomeQ.Where(x => x.IncomeDate <= to.Value);
            expenseQ = expenseQ.Where(x => x.ExpenseDate <= to.Value);
            labourQ = labourQ.Where(x => x.AttendanceDate <= to.Value);
            activityQ = activityQ.Where(x => x.ActivityDate <= to.Value);
            purchaseQ = purchaseQ.Where(x => x.PurchaseDate <= to.Value);
        }

        var farms = await _farmDb.Farms.Include(f => f.LandDetails).AsNoTracking().ToListAsync();
        var crops = await _farmDb.Crops.AsNoTracking().ToListAsync();
        var seasons = await _farmDb.CropSeasons.Include(s => s.Farm).Include(s => s.Crop).AsNoTracking().ToListAsync();

        var farmIdToName = farms.ToDictionary(f => (long)f.Id, f => f.FarmName);
        var farmNameToId = farms.GroupBy(f => f.FarmName, StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);
        var cropIdToName = crops.ToDictionary(c => (long)c.Id, c => c.CropName);

        var sales = (await salesQ.ToListAsync()).Where(s => MatchesFilter(s.Farm, query.Farm) && MatchesFilter(s.Crop, query.Crop)).ToList();
        var incomes = (await incomeQ.ToListAsync()).Where(i => IsNotCancelled(i.Status) && MatchesFilter(i.Farm, query.Farm) && MatchesFilter(i.Crop, query.Crop)).ToList();
        var expenses = (await expenseQ.ToListAsync()).Where(e => IsNotCancelled(e.Status) && MatchesFilter(e.Farm, query.Farm) && MatchesFilter(e.Crop, query.Crop)).ToList();
        var labours = (await labourQ.ToListAsync()).Where(l => MatchesFilter(l.FarmName, query.Farm) && MatchesFilter(l.CropName, query.Crop)).ToList();
        var activities = (await activityQ.ToListAsync()).Where(a => MatchesFilter(a.Farm, query.Farm) && MatchesFilter(a.Crop, query.Crop)).ToList();
        var purchases = (await purchaseQ.ToListAsync()).Select(p => new
        {
            Purchase = p,
            FarmName = p.FarmId.HasValue && farmIdToName.TryGetValue(p.FarmId.Value, out var fn) ? fn : string.Empty,
            CropName = p.CropId.HasValue && cropIdToName.TryGetValue(p.CropId.Value, out var cn) ? cn : string.Empty
        }).Where(x => MatchesFilter(x.FarmName, query.Farm) && MatchesFilter(x.CropName, query.Crop)).ToList();

        var cropAreaMap = seasons
            .Where(s => s.Crop != null)
            .GroupBy(s => s.Crop!.CropName, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.AreaAcres), StringComparer.OrdinalIgnoreCase);

        var farmAreaMap = farms.ToDictionary(
            f => f.FarmName,
            f => f.LandDetails.Sum(ld => ConvertToAcres(ld.LandArea, ld.AreaUnit)),
            StringComparer.OrdinalIgnoreCase);

        var allCropNames = sales.Select(s => s.Crop)
            .Concat(incomes.Select(i => i.Crop ?? string.Empty))
            .Concat(expenses.Select(e => e.Crop))
            .Concat(labours.Select(l => l.CropName))
            .Concat(activities.Select(a => a.Crop))
            .Concat(purchases.Select(p => p.CropName))
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var cropRows = allCropNames.Select(crop =>
        {
            var sRev = Math.Round(sales.Where(s => s.Crop.Equals(crop, StringComparison.OrdinalIgnoreCase)).Sum(s => s.NetAmount), 2);
            var oInc = Math.Round(incomes.Where(i => string.Equals(i.Crop, crop, StringComparison.OrdinalIgnoreCase)).Sum(i => i.NetAmount), 2);
            var rev = Math.Round(sRev + oInc, 2);

            var opExp = Math.Round(expenses.Where(e => e.Crop.Equals(crop, StringComparison.OrdinalIgnoreCase)).Sum(e => e.Amount), 2);
            var labCost = Math.Round(labours.Where(l => l.CropName.Equals(crop, StringComparison.OrdinalIgnoreCase)).Sum(l => l.CalculatedAmount > 0 ? l.CalculatedAmount : l.Amount), 2);
            var purCost = Math.Round(purchases.Where(p => p.CropName.Equals(crop, StringComparison.OrdinalIgnoreCase)).Sum(p => p.Purchase.TotalAmount), 2);
            var actCost = Math.Round(activities.Where(a => a.Crop.Equals(crop, StringComparison.OrdinalIgnoreCase)).Sum(a => a.TotalCost), 2);
            var exp = Math.Round(opExp + labCost + purCost + actCost, 2);
            var profit = Math.Round(rev - exp, 2);

            return new CropProfitRowDto
            {
                Crop = crop,
                SalesRevenue = sRev,
                OtherIncome = oInc,
                Revenue = rev,
                OperatingExpenses = opExp,
                LabourCost = labCost,
                InputPurchases = purCost,
                ActivityCost = actCost,
                Expenses = exp,
                NetProfit = profit,
                ProfitMarginPercent = SafePercent(profit, rev),
                AreaAcres = Math.Round(cropAreaMap.GetValueOrDefault(crop, 0m), 2)
            };
        }).OrderByDescending(r => r.NetProfit).ToList();

        var allFarmNames = sales.Select(s => s.Farm)
            .Concat(incomes.Select(i => i.Farm))
            .Concat(expenses.Select(e => e.Farm))
            .Concat(labours.Select(l => l.FarmName))
            .Concat(activities.Select(a => a.Farm))
            .Concat(purchases.Select(p => p.FarmName))
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var farmRows = allFarmNames.Select(farm =>
        {
            var sRev = Math.Round(sales.Where(s => s.Farm.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(s => s.NetAmount), 2);
            var oInc = Math.Round(incomes.Where(i => i.Farm.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(i => i.NetAmount), 2);
            var rev = Math.Round(sRev + oInc, 2);

            var opExp = Math.Round(expenses.Where(e => e.Farm.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(e => e.Amount), 2);
            var labCost = Math.Round(labours.Where(l => l.FarmName.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(l => l.CalculatedAmount > 0 ? l.CalculatedAmount : l.Amount), 2);
            var purCost = Math.Round(purchases.Where(p => p.FarmName.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(p => p.Purchase.TotalAmount), 2);
            var actCost = Math.Round(activities.Where(a => a.Farm.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(a => a.TotalCost), 2);
            var exp = Math.Round(opExp + labCost + purCost + actCost, 2);
            var profit = Math.Round(rev - exp, 2);

            var seasonAcres = seasons.Where(s => s.Farm != null && s.Farm.FarmName.Equals(farm, StringComparison.OrdinalIgnoreCase)).Sum(s => s.AreaAcres);
            var landAcres = farmAreaMap.GetValueOrDefault(farm, 0m);

            return new FarmProfitRowDto
            {
                FarmId = farmNameToId.TryGetValue(farm, out var fid) ? fid : null,
                Farm = farm,
                AreaAcres = Math.Round(landAcres > 0 ? landAcres : seasonAcres, 2),
                SalesRevenue = sRev,
                OtherIncome = oInc,
                Revenue = rev,
                OperatingExpenses = opExp,
                LabourCost = labCost,
                InputPurchases = purCost,
                ActivityCost = actCost,
                Expenses = exp,
                NetProfit = profit,
                ProfitMarginPercent = SafePercent(profit, rev)
            };
        }).OrderByDescending(r => r.NetProfit).ToList();

        return new AgriAggregateSnapshot
        {
            Crops = cropRows,
            Farms = farmRows,
            CropSoldQty = sales.GroupBy(s => s.Crop.Trim(), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity), StringComparer.OrdinalIgnoreCase),
            FarmSoldQty = sales.GroupBy(s => s.Farm.Trim(), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity), StringComparer.OrdinalIgnoreCase),
            CropSalesTxCount = sales.GroupBy(s => s.Crop.Trim(), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
            CropIncomeTxCount = incomes.Where(i => !string.IsNullOrWhiteSpace(i.Crop)).GroupBy(i => i.Crop!.Trim(), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase),
            CropExpenseTxCount = expenses.GroupBy(e => e.Crop.Trim(), StringComparer.OrdinalIgnoreCase).ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase)
        };
    }

    public async Task<ReportResponse<CropIncomeSummaryDto, CropIncomeRowDto>> GetCropIncomeReportAsync(ReportQueryParameters query)
    {
        var snap = await BuildAgriSnapshotAsync(query);
        var totalIncome = Math.Round(snap.Crops.Sum(c => c.Revenue), 2);

        var rows = snap.Crops
            .Where(c => c.Revenue > 0)
            .Select(c => new CropIncomeRowDto
            {
                Crop = c.Crop,
                SalesCount = snap.CropSalesTxCount.GetValueOrDefault(c.Crop, 0),
                SalesRevenue = c.SalesRevenue,
                TotalQuantitySold = Math.Round(snap.CropSoldQty.GetValueOrDefault(c.Crop, 0m), 2),
                OtherIncomeCount = snap.CropIncomeTxCount.GetValueOrDefault(c.Crop, 0),
                OtherIncome = c.OtherIncome,
                TotalIncome = c.Revenue,
                SharePercent = SafePercent(c.Revenue, totalIncome)
            })
            .OrderByDescending(r => r.TotalIncome)
            .ToList();

        return new ReportResponse<CropIncomeSummaryDto, CropIncomeRowDto>
        {
            ReportKey = "crop-income",
            ReportTitle = "Crop-wise Income Report",
            Filters = query,
            Summary = new CropIncomeSummaryDto
            {
                TotalCrops = rows.Count,
                TotalSalesRevenue = Math.Round(rows.Sum(r => r.SalesRevenue), 2),
                TotalOtherIncome = Math.Round(rows.Sum(r => r.OtherIncome), 2),
                TotalIncome = totalIncome,
                TopCrop = rows.FirstOrDefault()?.Crop ?? "—"
            },
            Rows = rows
        };
    }

    public async Task<ReportResponse<CropExpenseSummaryDto, CropExpenseRowDto>> GetCropExpenseReportAsync(ReportQueryParameters query)
    {
        var snap = await BuildAgriSnapshotAsync(query);
        var totalExpense = Math.Round(snap.Crops.Sum(c => c.Expenses), 2);

        var rows = snap.Crops
            .Where(c => c.Expenses > 0)
            .Select(c => new CropExpenseRowDto
            {
                Crop = c.Crop,
                OperatingExpenses = c.OperatingExpenses,
                LabourCost = c.LabourCost,
                InputPurchases = c.InputPurchases,
                ActivityCost = c.ActivityCost,
                TransactionCount = snap.CropExpenseTxCount.GetValueOrDefault(c.Crop, 0),
                TotalExpense = c.Expenses,
                SharePercent = SafePercent(c.Expenses, totalExpense)
            })
            .OrderByDescending(r => r.TotalExpense)
            .ToList();

        return new ReportResponse<CropExpenseSummaryDto, CropExpenseRowDto>
        {
            ReportKey = "crop-expense",
            ReportTitle = "Crop-wise Expense Report",
            Filters = query,
            Summary = new CropExpenseSummaryDto
            {
                TotalCrops = rows.Count,
                TotalOperatingExpenses = Math.Round(rows.Sum(r => r.OperatingExpenses), 2),
                TotalLabourCost = Math.Round(rows.Sum(r => r.LabourCost), 2),
                TotalInputPurchases = Math.Round(rows.Sum(r => r.InputPurchases), 2),
                TotalActivityCost = Math.Round(rows.Sum(r => r.ActivityCost), 2),
                TotalExpense = totalExpense,
                HighestCostCrop = rows.FirstOrDefault()?.Crop ?? "—"
            },
            Rows = rows
        };
    }

    public async Task<List<CropProfitRowDto>> GetCropProfitReportAsync(ReportQueryParameters query) =>
        (await BuildAgriSnapshotAsync(query)).Crops;

    public async Task<List<FarmProfitRowDto>> GetFarmProfitReportAsync(ReportQueryParameters query) =>
        (await BuildAgriSnapshotAsync(query)).Farms;

    public async Task<ReportResponse<SeasonProfitSummaryDto, SeasonProfitRowDto>> GetSeasonProfitReportAsync(ReportQueryParameters query)
    {
        var seasons = await _farmDb.CropSeasons
            .Include(s => s.Farm)
            .Include(s => s.Crop)
            .AsNoTracking()
            .ToListAsync();

        var filteredSeasons = seasons.Where(s =>
            MatchesFilter(s.SeasonName, query.Season) &&
            MatchesFilter(s.Farm?.FarmName, query.Farm) &&
            MatchesFilter(s.Crop?.CropName, query.Crop) &&
            MatchesFilter(s.Status, query.Status) &&
            (!query.FromDate.HasValue || s.SowingDate >= query.FromDate.Value) &&
            (!query.ToDate.HasValue || s.SowingDate <= query.ToDate.Value))
            .ToList();

        var sales = await _salesDb.Sales.AsNoTracking().ToListAsync();
        var incomes = (await _farmDb.IncomeTransactions.AsNoTracking().ToListAsync()).Where(i => IsNotCancelled(i.Status)).ToList();
        var expenses = (await _expenseDb.ExpenseTransactions.AsNoTracking().ToListAsync()).Where(e => IsNotCancelled(e.Status)).ToList();
        var labours = await _farmDb.LabourAttendances.AsNoTracking().ToListAsync();
        var activities = await _farmDb.CropActivities.AsNoTracking().ToListAsync();
        var purchases = await _farmDb.Purchases.AsNoTracking().ToListAsync();

        var rows = new List<SeasonProfitRowDto>();
        foreach (var s in filteredSeasons)
        {
            var farmName = s.Farm?.FarmName ?? string.Empty;
            var cropName = s.Crop?.CropName ?? string.Empty;
            var windowStart = s.SowingDate.Date;
            var windowEnd = (s.ActualHarvestDate ?? s.ExpectedHarvestDate ?? s.SowingDate.AddDays(s.Crop?.DurationDays ?? 120)).Date.AddDays(30);

            bool MatchFarmCrop(string? f, string? c, DateTime d) =>
                d.Date >= windowStart && d.Date <= windowEnd &&
                (string.IsNullOrEmpty(farmName) || string.Equals(f, farmName, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrEmpty(cropName) || string.Equals(c, cropName, StringComparison.OrdinalIgnoreCase));

            var matchedRevenue =
                sales.Where(x => MatchFarmCrop(x.Farm, x.Crop, x.SalesDate)).Sum(x => x.NetAmount) +
                incomes.Where(x => MatchFarmCrop(x.Farm, x.Crop, x.IncomeDate)).Sum(x => x.NetAmount);

            var actualRev = Math.Round((s.ActualRevenue.HasValue && s.ActualRevenue.Value > 0) ? s.ActualRevenue.Value : matchedRevenue, 2);

            var opCost = Math.Round(expenses.Where(x => MatchFarmCrop(x.Farm, x.Crop, x.ExpenseDate)).Sum(x => x.Amount), 2);
            var labCost = Math.Round(labours.Where(x => MatchFarmCrop(x.FarmName, x.CropName, x.AttendanceDate)).Sum(x => x.CalculatedAmount > 0 ? x.CalculatedAmount : x.Amount), 2);
            var purCost = Math.Round(purchases.Where(x => x.PurchaseDate.Date >= windowStart && x.PurchaseDate.Date <= windowEnd && x.FarmId == s.FarmId && x.CropId == s.CropId).Sum(x => x.TotalAmount), 2);
            var actCost = Math.Round(activities.Where(x => (x.SeasonId == s.Id || string.Equals(x.Season, s.SeasonName, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrEmpty(cropName) || string.Equals(x.Crop, cropName, StringComparison.OrdinalIgnoreCase))).Sum(x => x.TotalCost), 2);

            var totalCost = Math.Round(opCost + labCost + purCost + actCost, 2);
            var netProfit = Math.Round(actualRev - totalCost, 2);

            rows.Add(new SeasonProfitRowDto
            {
                SeasonId = s.Id,
                SeasonName = s.SeasonName,
                FarmName = farmName,
                CropName = cropName,
                SowingDate = s.SowingDate,
                HarvestDate = s.ActualHarvestDate ?? s.ExpectedHarvestDate,
                AreaAcres = Math.Round(s.AreaAcres, 2),
                ExpectedRevenue = Math.Round(s.ExpectedRevenue ?? 0m, 2),
                ActualRevenue = actualRev,
                OperatingExpenses = opCost,
                LabourCost = labCost,
                InputPurchases = purCost,
                ActivityCost = actCost,
                TotalCost = totalCost,
                NetProfit = netProfit,
                ProfitMarginPercent = SafePercent(netProfit, actualRev),
                Status = s.Status
            });
        }

        var ordered = rows.OrderByDescending(r => r.SowingDate).ToList();
        var totalRev = Math.Round(ordered.Sum(r => r.ActualRevenue), 2);
        var totalNet = Math.Round(ordered.Sum(r => r.NetProfit), 2);

        return new ReportResponse<SeasonProfitSummaryDto, SeasonProfitRowDto>
        {
            ReportKey = "season-profit",
            ReportTitle = "Season-wise Profit Report",
            Filters = query,
            Summary = new SeasonProfitSummaryDto
            {
                TotalSeasons = ordered.Count,
                TotalAreaAcres = Math.Round(ordered.Sum(r => r.AreaAcres), 2),
                TotalExpectedRevenue = Math.Round(ordered.Sum(r => r.ExpectedRevenue), 2),
                TotalActualRevenue = totalRev,
                TotalCost = Math.Round(ordered.Sum(r => r.TotalCost), 2),
                TotalNetProfit = totalNet,
                OverallMarginPercent = SafePercent(totalNet, totalRev)
            },
            Rows = ordered
        };
    }

    public async Task<ReportResponse<AcreMetricSummaryDto, AcreCostRowDto>> GetAcreCostReportAsync(ReportQueryParameters query)
    {
        var snap = await BuildAgriSnapshotAsync(query);

        var rows = new List<AcreCostRowDto>();
        rows.AddRange(snap.Farms.Select(f => new AcreCostRowDto
        {
            GroupType = "Farm",
            Name = f.Farm,
            AreaAcres = f.AreaAcres,
            OperatingCost = f.OperatingExpenses,
            LabourCost = f.LabourCost,
            InputCost = f.InputPurchases,
            ActivityCost = f.ActivityCost,
            TotalCost = f.Expenses,
            CostPerAcre = f.AreaAcres > 0 ? Math.Round(f.Expenses / f.AreaAcres, 2) : 0m
        }));
        rows.AddRange(snap.Crops.Select(c => new AcreCostRowDto
        {
            GroupType = "Crop",
            Name = c.Crop,
            AreaAcres = c.AreaAcres,
            OperatingCost = c.OperatingExpenses,
            LabourCost = c.LabourCost,
            InputCost = c.InputPurchases,
            ActivityCost = c.ActivityCost,
            TotalCost = c.Expenses,
            CostPerAcre = c.AreaAcres > 0 ? Math.Round(c.Expenses / c.AreaAcres, 2) : 0m
        }));

        var farmAreaTotal = Math.Round(snap.Farms.Sum(f => f.AreaAcres), 2);
        var farmCostTotal = Math.Round(snap.Farms.Sum(f => f.Expenses), 2);

        return new ReportResponse<AcreMetricSummaryDto, AcreCostRowDto>
        {
            ReportKey = "acre-cost",
            ReportTitle = "Acre-wise Cost Report",
            Filters = query,
            Summary = new AcreMetricSummaryDto
            {
                TotalAreaAcres = farmAreaTotal,
                TotalAmount = farmCostTotal,
                AveragePerAcre = farmAreaTotal > 0 ? Math.Round(farmCostTotal / farmAreaTotal, 2) : 0m,
                GroupCount = rows.Count
            },
            Rows = rows.OrderByDescending(r => r.CostPerAcre).ToList()
        };
    }

    public async Task<ReportResponse<AcreMetricSummaryDto, AcreRevenueRowDto>> GetAcreRevenueReportAsync(ReportQueryParameters query)
    {
        var snap = await BuildAgriSnapshotAsync(query);

        var rows = new List<AcreRevenueRowDto>();
        rows.AddRange(snap.Farms.Select(f =>
        {
            var qty = snap.FarmSoldQty.GetValueOrDefault(f.Farm, 0m);
            return new AcreRevenueRowDto
            {
                GroupType = "Farm",
                Name = f.Farm,
                AreaAcres = f.AreaAcres,
                SalesRevenue = f.SalesRevenue,
                OtherIncome = f.OtherIncome,
                TotalRevenue = f.Revenue,
                RevenuePerAcre = f.AreaAcres > 0 ? Math.Round(f.Revenue / f.AreaAcres, 2) : 0m,
                SoldQuantity = Math.Round(qty, 2),
                YieldPerAcre = f.AreaAcres > 0 ? Math.Round(qty / f.AreaAcres, 2) : 0m
            };
        }));
        rows.AddRange(snap.Crops.Select(c =>
        {
            var qty = snap.CropSoldQty.GetValueOrDefault(c.Crop, 0m);
            return new AcreRevenueRowDto
            {
                GroupType = "Crop",
                Name = c.Crop,
                AreaAcres = c.AreaAcres,
                SalesRevenue = c.SalesRevenue,
                OtherIncome = c.OtherIncome,
                TotalRevenue = c.Revenue,
                RevenuePerAcre = c.AreaAcres > 0 ? Math.Round(c.Revenue / c.AreaAcres, 2) : 0m,
                SoldQuantity = Math.Round(qty, 2),
                YieldPerAcre = c.AreaAcres > 0 ? Math.Round(qty / c.AreaAcres, 2) : 0m
            };
        }));

        var farmAreaTotal = Math.Round(snap.Farms.Sum(f => f.AreaAcres), 2);
        var farmRevTotal = Math.Round(snap.Farms.Sum(f => f.Revenue), 2);

        return new ReportResponse<AcreMetricSummaryDto, AcreRevenueRowDto>
        {
            ReportKey = "acre-revenue",
            ReportTitle = "Acre-wise Revenue Report",
            Filters = query,
            Summary = new AcreMetricSummaryDto
            {
                TotalAreaAcres = farmAreaTotal,
                TotalAmount = farmRevTotal,
                AveragePerAcre = farmAreaTotal > 0 ? Math.Round(farmRevTotal / farmAreaTotal, 2) : 0m,
                GroupCount = rows.Count
            },
            Rows = rows.OrderByDescending(r => r.RevenuePerAcre).ToList()
        };
    }

    public async Task<ReportResponse<YieldReportSummaryDto, YieldReportRowDto>> GetYieldReportAsync(ReportQueryParameters query)
    {
        var seasons = await _farmDb.CropSeasons
            .Include(s => s.Farm)
            .Include(s => s.Crop)
            .AsNoTracking()
            .ToListAsync();

        var sales = await _salesDb.Sales.AsNoTracking().ToListAsync();

        var filtered = seasons.Where(s =>
            MatchesFilter(s.SeasonName, query.Season) &&
            MatchesFilter(s.Farm?.FarmName, query.Farm) &&
            MatchesFilter(s.Crop?.CropName, query.Crop) &&
            MatchesFilter(s.Status, query.Status) &&
            (!query.FromDate.HasValue || s.SowingDate >= query.FromDate.Value) &&
            (!query.ToDate.HasValue || s.SowingDate <= query.ToDate.Value))
            .ToList();

        var rows = filtered.Select(s =>
        {
            var farmName = s.Farm?.FarmName ?? string.Empty;
            var cropName = s.Crop?.CropName ?? string.Empty;
            var windowEnd = (s.ActualHarvestDate ?? s.ExpectedHarvestDate ?? s.SowingDate.AddDays(s.Crop?.DurationDays ?? 120)).Date.AddDays(30);

            var soldQty = sales
                .Where(x => x.SalesDate.Date >= s.SowingDate.Date && x.SalesDate.Date <= windowEnd &&
                            (string.IsNullOrEmpty(farmName) || x.Farm.Equals(farmName, StringComparison.OrdinalIgnoreCase)) &&
                            (string.IsNullOrEmpty(cropName) || x.Crop.Equals(cropName, StringComparison.OrdinalIgnoreCase)))
                .Sum(x => x.Quantity);

            var expected = Math.Round(s.ExpectedYield ?? 0m, 2);
            var actual = Math.Round((s.ActualYield.HasValue && s.ActualYield.Value > 0) ? s.ActualYield.Value : soldQty, 2);

            return new YieldReportRowDto
            {
                SeasonId = s.Id,
                SeasonName = s.SeasonName,
                FarmName = farmName,
                CropName = cropName,
                Unit = s.Crop?.DefaultUnit ?? "Bags",
                AreaAcres = Math.Round(s.AreaAcres, 2),
                ExpectedYield = expected,
                ActualYield = actual,
                SoldQuantity = Math.Round(soldQty, 2),
                YieldVariance = Math.Round(actual - expected, 2),
                YieldAchievementPercent = SafePercent(actual, expected),
                YieldPerAcre = s.AreaAcres > 0 ? Math.Round(actual / s.AreaAcres, 2) : 0m,
                Status = s.Status
            };
        }).OrderByDescending(r => r.ActualYield).ToList();

        var totalArea = Math.Round(rows.Sum(r => r.AreaAcres), 2);
        var totalExpected = Math.Round(rows.Sum(r => r.ExpectedYield), 2);
        var totalActual = Math.Round(rows.Sum(r => r.ActualYield), 2);

        return new ReportResponse<YieldReportSummaryDto, YieldReportRowDto>
        {
            ReportKey = "yield",
            ReportTitle = "Crop Yield Report",
            Filters = query,
            Summary = new YieldReportSummaryDto
            {
                TotalCropSeasons = rows.Count,
                TotalAreaAcres = totalArea,
                TotalExpectedYield = totalExpected,
                TotalActualYield = totalActual,
                TotalSoldQuantity = Math.Round(rows.Sum(r => r.SoldQuantity), 2),
                OverallAchievementPercent = SafePercent(totalActual, totalExpected),
                AverageYieldPerAcre = totalArea > 0 ? Math.Round(totalActual / totalArea, 2) : 0m
            },
            Rows = rows
        };
    }

    public async Task<LabourCostReportDto> GetLabourCostReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var workers = await _farmDb.Labours.AsNoTracking().ToListAsync();
        var attendances = await _farmDb.LabourAttendances.AsNoTracking().ToListAsync();
        var payments = await _farmDb.LabourPayments.AsNoTracking().ToListAsync();
        var directExpenses = (await _expenseDb.ExpenseTransactions.AsNoTracking().ToListAsync())
            .Where(e => IsNotCancelled(e.Status) && IsLabourExpenseCategory(e.ExpenseCategory))
            .ToList();

        var filteredAtt = attendances.Where(a =>
            (!from.HasValue || a.AttendanceDate >= from.Value) &&
            (!to.HasValue || a.AttendanceDate <= to.Value) &&
            MatchesFilter(a.FarmName, query.Farm) &&
            MatchesFilter(a.CropName, query.Crop) &&
            MatchesFilter(a.WorkType, query.Category))
            .ToList();

        var filteredPay = payments.Where(p =>
            (!from.HasValue || p.PaymentDate >= from.Value) &&
            (!to.HasValue || p.PaymentDate <= to.Value))
            .ToList();

        var filteredDirect = directExpenses.Where(e =>
            (!from.HasValue || e.ExpenseDate >= from.Value) &&
            (!to.HasValue || e.ExpenseDate <= to.Value) &&
            MatchesFilter(e.Farm, query.Farm) &&
            MatchesFilter(e.Crop, query.Crop))
            .ToList();

        var totalEarned = Math.Round(filteredAtt.Sum(a => a.CalculatedAmount > 0 ? a.CalculatedAmount : a.Amount), 2);
        var totalPaid = Math.Round(filteredPay.Sum(p => p.AmountPaid), 2);

        var byWorker = workers.Select(w =>
        {
            var att = filteredAtt.Where(a => a.LabourId == w.Id).ToList();
            var pay = filteredPay.Where(p => p.LabourId == w.Id).ToList();
            var earned = Math.Round(att.Sum(a => a.CalculatedAmount > 0 ? a.CalculatedAmount : a.Amount), 2);
            var paid = Math.Round(pay.Sum(p => p.AmountPaid), 2);
            return new LabourWorkerSummaryDto
            {
                LabourId = w.Id,
                LabourCode = w.LabourCode,
                LabourName = w.LabourName,
                DailyRate = w.DailyRate,
                AttendanceDays = att.Count,
                TotalUnitsWorked = Math.Round(att.Sum(a => a.UnitsWorked), 2),
                EarnedWages = earned,
                PaidWages = paid,
                BalanceWages = Math.Round(Math.Max(0m, earned - paid), 2),
                Status = w.Status
            };
        }).OrderByDescending(w => w.EarnedWages).ToList();

        List<CategoryBreakdownDto> GroupAtt(Func<FarmManagementApi.Models.LabourAttendance, string> selector) =>
            filteredAtt.GroupBy(a => NormalizeKey(selector(a)), StringComparer.OrdinalIgnoreCase)
                .Select(g =>
                {
                    var amt = Math.Round(g.Sum(a => a.CalculatedAmount > 0 ? a.CalculatedAmount : a.Amount), 2);
                    return new CategoryBreakdownDto
                    {
                        Category = g.Key,
                        Count = g.Count(),
                        Amount = amt,
                        SharePercent = SafePercent(amt, totalEarned)
                    };
                })
                .OrderByDescending(x => x.Amount)
                .ToList();

        return new LabourCostReportDto
        {
            TotalWorkers = workers.Count,
            ActiveWorkers = workers.Count(w => string.Equals(w.Status, "Active", StringComparison.OrdinalIgnoreCase)),
            TotalAttendanceEntries = filteredAtt.Count,
            TotalUnitsWorked = Math.Round(filteredAtt.Sum(a => a.UnitsWorked), 2),
            TotalCalculatedWages = totalEarned,
            TotalPaidWages = totalPaid,
            OutstandingWages = Math.Round(Math.Max(0m, totalEarned - totalPaid), 2),
            DirectLabourExpenses = Math.Round(filteredDirect.Sum(e => e.Amount), 2),
            ByWorker = byWorker,
            ByWorkType = GroupAtt(a => a.WorkType),
            ByFarm = GroupAtt(a => a.FarmName),
            ByCrop = GroupAtt(a => a.CropName)
        };
    }

    public async Task<InputCostReportDto> GetInputCostReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var farms = await _farmDb.Farms.AsNoTracking().ToDictionaryAsync(f => (long)f.Id, f => f.FarmName);
        var crops = await _farmDb.Crops.AsNoTracking().ToDictionaryAsync(c => (long)c.Id, c => c.CropName);

        var purchases = await _farmDb.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.Items)
            .AsNoTracking()
            .ToListAsync();

        var directInputExpenses = (await _expenseDb.ExpenseTransactions.AsNoTracking().ToListAsync())
            .Where(e => IsNotCancelled(e.Status) && IsInputExpenseCategory(e.ExpenseCategory))
            .ToList();

        var stockOutTx = await _farmDb.InventoryTransactions
            .Include(t => t.Product).ThenInclude(p => p!.Category)
            .AsNoTracking()
            .Where(t => t.TransactionType == "StockOut" || t.TransactionType == "Stock Out" || t.Quantity < 0)
            .ToListAsync();

        var filteredPurchases = purchases.Where(p =>
            (!from.HasValue || p.PurchaseDate >= from.Value) &&
            (!to.HasValue || p.PurchaseDate <= to.Value) &&
            MatchesFilter(p.FarmId.HasValue ? farms.GetValueOrDefault(p.FarmId.Value) : null, query.Farm) &&
            MatchesFilter(p.CropId.HasValue ? crops.GetValueOrDefault(p.CropId.Value) : null, query.Crop))
            .ToList();

        var filteredExpenses = directInputExpenses.Where(e =>
            (!from.HasValue || e.ExpenseDate >= from.Value) &&
            (!to.HasValue || e.ExpenseDate <= to.Value) &&
            MatchesFilter(e.Farm, query.Farm) &&
            MatchesFilter(e.Crop, query.Crop) &&
            MatchesFilter(e.ExpenseCategory, query.Category))
            .ToList();

        var filteredStockOut = stockOutTx.Where(t =>
            (!from.HasValue || t.TransactionDate >= from.Value) &&
            (!to.HasValue || t.TransactionDate <= to.Value) &&
            MatchesFilter(ExtractTag(t.Notes, "Farm"), query.Farm) &&
            MatchesFilter(ExtractTag(t.Notes, "Crop"), query.Crop) &&
            MatchesFilter(t.Product?.Category?.Name, query.Category))
            .ToList();

        var purchaseCost = Math.Round(filteredPurchases.Sum(p => p.TotalAmount), 2);
        var expenseCost = Math.Round(filteredExpenses.Sum(e => e.Amount), 2);
        var consumptionCost = Math.Round(filteredStockOut.Sum(t => Math.Abs(t.Quantity) * (t.UnitPrice > 0 ? t.UnitPrice : t.Product?.StandardCost ?? 0m)), 2);
        var combined = Math.Round(purchaseCost + expenseCost, 2);

        var byCategory = filteredExpenses
            .Select(e => (Category: NormalizeKey(e.ExpenseCategory, "Inputs"), Amount: e.Amount))
            .Concat(filteredStockOut.Select(t => (Category: t.Product?.Category?.Name ?? "Inventory Inputs", Amount: Math.Abs(t.Quantity) * (t.UnitPrice > 0 ? t.UnitPrice : t.Product?.StandardCost ?? 0m))))
            .GroupBy(x => x.Category, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.Amount), 2);
                return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, combined > 0 ? combined : consumptionCost) };
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        var byProduct = filteredPurchases.SelectMany(p => p.Items)
            .GroupBy(i => NormalizeKey(i.ProductName, "Input Item"), StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.Total), 2);
                return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, purchaseCost) };
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        var bySupplier = filteredPurchases
            .GroupBy(p => p.Supplier?.SupplierName ?? p.Supplier?.Name ?? $"Supplier #{p.SupplierId}", StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.TotalAmount), 2);
                return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, purchaseCost) };
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        var byCrop = filteredPurchases.Select(p => (Crop: p.CropId.HasValue ? crops.GetValueOrDefault(p.CropId.Value, "Unassigned") : "Unassigned", Amount: p.TotalAmount))
            .Concat(filteredExpenses.Select(e => (Crop: NormalizeKey(e.Crop), Amount: e.Amount)))
            .GroupBy(x => x.Crop, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.Amount), 2);
                return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, combined) };
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        var byFarm = filteredPurchases.Select(p => (Farm: p.FarmId.HasValue ? farms.GetValueOrDefault(p.FarmId.Value, "Unassigned") : "Unassigned", Amount: p.TotalAmount))
            .Concat(filteredExpenses.Select(e => (Farm: NormalizeKey(e.Farm), Amount: e.Amount)))
            .GroupBy(x => x.Farm, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(x => x.Amount), 2);
                return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, combined) };
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return new InputCostReportDto
        {
            TotalPurchaseInputCost = purchaseCost,
            TotalDirectInputExpenses = expenseCost,
            TotalStockConsumptionCost = consumptionCost,
            TotalInputCost = combined,
            PurchaseOrdersCount = filteredPurchases.Count,
            DirectExpenseCount = filteredExpenses.Count,
            ConsumptionEventsCount = filteredStockOut.Count,
            ByCategory = byCategory,
            ByProduct = byProduct,
            BySupplier = bySupplier,
            ByCrop = byCrop,
            ByFarm = byFarm
        };
    }

    public async Task<MachineryCostReportDto> GetMachineryCostReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var machines = await _machineryDb.Machineries.AsNoTracking().ToListAsync();
        var machExpenses = await _machineryDb.MachineryExpenses.AsNoTracking().ToListAsync();
        var directMachExpenses = (await _expenseDb.ExpenseTransactions.AsNoTracking().ToListAsync())
            .Where(e => IsNotCancelled(e.Status) && IsMachineryExpenseCategory(e.ExpenseCategory))
            .ToList();

        var filteredExp = machExpenses.Where(e =>
            (!from.HasValue || e.Date >= from.Value) &&
            (!to.HasValue || e.Date <= to.Value) &&
            MatchesFilter(e.ExpenseType, query.Category) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             e.MachineName.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             e.ExpenseType.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             (e.Operator ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(e => e.Date)
            .ToList();

        var filteredDirect = directMachExpenses.Where(e =>
            (!from.HasValue || e.ExpenseDate >= from.Value) &&
            (!to.HasValue || e.ExpenseDate <= to.Value) &&
            MatchesFilter(e.Farm, query.Farm) &&
            MatchesFilter(e.Crop, query.Crop))
            .ToList();

        var totalOperating = Math.Round(filteredExp.Sum(e => e.Amount), 2);
        var totalDirect = Math.Round(filteredDirect.Sum(e => e.Amount), 2);

        var byMachine = machines.Select(m =>
        {
            var exps = filteredExp.Where(e => e.MachineryId == m.Id || e.MachineName.Equals(m.MachineName, StringComparison.OrdinalIgnoreCase)).ToList();
            var opCost = Math.Round(exps.Sum(e => e.Amount), 2);
            return new MachineryCostBreakdownDto
            {
                MachineryId = m.Id,
                MachineName = m.MachineName,
                MachineType = m.MachineType,
                Status = m.Status,
                PurchaseCost = Math.Round(m.PurchaseCost, 2),
                CurrentValue = Math.Round(m.CurrentValue, 2),
                ExpenseCount = exps.Count,
                TotalOperatingCost = opCost,
                CostToPurchaseRatioPercent = SafePercent(opCost, m.PurchaseCost)
            };
        }).OrderByDescending(x => x.TotalOperatingCost).ToList();

        var byType = filteredExp
            .GroupBy(e => NormalizeKey(e.ExpenseType, "Other"), StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var amt = Math.Round(g.Sum(e => e.Amount), 2);
                return new CategoryBreakdownDto
                {
                    Category = g.Key,
                    Count = g.Count(),
                    Amount = amt,
                    SharePercent = SafePercent(amt, totalOperating)
                };
            })
            .OrderByDescending(x => x.Amount)
            .ToList();

        return new MachineryCostReportDto
        {
            TotalMachines = machines.Count,
            ActiveMachines = machines.Count(m => string.Equals(m.Status, "Active", StringComparison.OrdinalIgnoreCase)),
            TotalFleetPurchaseCost = Math.Round(machines.Sum(m => m.PurchaseCost), 2),
            TotalFleetCurrentValue = Math.Round(machines.Sum(m => m.CurrentValue), 2),
            TotalMachineryOperatingCost = totalOperating,
            TotalDirectMachineryExpenses = totalDirect,
            TotalCombinedMachineryCost = Math.Round(totalOperating + totalDirect, 2),
            ExpenseEntriesCount = filteredExp.Count,
            ByMachine = byMachine,
            ByExpenseType = byType,
            Expenses = filteredExp.Select(e => new MachineryExpenseRowDto
            {
                Id = e.Id,
                MachineryId = e.MachineryId,
                MachineName = e.MachineName,
                ExpenseType = e.ExpenseType,
                Date = e.Date,
                Amount = Math.Round(e.Amount, 2),
                Operator = e.Operator,
                Remarks = e.Remarks
            }).ToList()
        };
    }

    // =========================================================================
    // C. INVENTORY REPORTS (22 - 26)
    // =========================================================================

    public async Task<ReportResponse<StockReportSummaryDto, StockReportRowDto>> GetStockReportAsync(ReportQueryParameters query)
    {
        var inventories = await _farmDb.Inventory
            .Include(i => i.Product).ThenInclude(p => p!.Category)
            .Include(i => i.Product).ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(i => i.Product != null && i.Product.IsActive)
            .ToListAsync();

        var rows = inventories.Select(i =>
        {
            var prod = i.Product!;
            var status = i.CurrentStock <= 0 ? "Out of Stock"
                : (prod.ReorderLevel > 0 && i.CurrentStock <= prod.ReorderLevel ? "Low Stock" : "In Stock");
            var value = Math.Round(i.CurrentStock * prod.StandardCost, 2);

            return new StockReportRowDto
            {
                InventoryId = i.Id,
                ProductId = i.ProductId,
                ProductCode = prod.Code,
                ProductName = prod.Name,
                CategoryName = prod.Category?.Name ?? "General",
                Unit = prod.Units?.ShortCode ?? "Units",
                StorageLocation = i.StorageLocation,
                CurrentStock = Math.Round(i.CurrentStock, 2),
                ReservedStock = Math.Round(i.ReservedStock, 2),
                AvailableStock = Math.Round(Math.Max(0m, i.CurrentStock - i.ReservedStock), 2),
                ReorderLevel = Math.Round(prod.ReorderLevel, 2),
                StandardCost = Math.Round(prod.StandardCost, 2),
                StockValue = value,
                StockStatus = status,
                LastUpdated = i.LastUpdated
            };
        }).Where(r =>
            MatchesFilter(r.CategoryName, query.Category) &&
            MatchesFilter(r.StorageLocation, query.Location) &&
            MatchesFilter(r.StockStatus, query.Status) &&
            (!query.ProductId.HasValue || r.ProductId == query.ProductId.Value) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.ProductName.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.ProductCode.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.StorageLocation.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
        .OrderBy(r => r.ProductName)
        .ToList();

        var totalVal = Math.Round(rows.Sum(r => r.StockValue), 2);

        return new ReportResponse<StockReportSummaryDto, StockReportRowDto>
        {
            ReportKey = "stock",
            ReportTitle = "Inventory Stock Report",
            Filters = query,
            Summary = new StockReportSummaryDto
            {
                TotalRecords = rows.Count,
                DistinctProducts = rows.Select(r => r.ProductId).Distinct().Count(),
                DistinctLocations = rows.Select(r => r.StorageLocation).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
                TotalCurrentStock = Math.Round(rows.Sum(r => r.CurrentStock), 2),
                TotalReservedStock = Math.Round(rows.Sum(r => r.ReservedStock), 2),
                TotalStockValuation = totalVal,
                InStockCount = rows.Count(r => r.StockStatus == "In Stock"),
                LowStockCount = rows.Count(r => r.StockStatus == "Low Stock"),
                OutOfStockCount = rows.Count(r => r.StockStatus == "Out of Stock"),
                ByCategory = rows.GroupBy(r => r.CategoryName, StringComparer.OrdinalIgnoreCase)
                    .Select(g => { var val = Math.Round(g.Sum(x => x.StockValue), 2); return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = val, SharePercent = SafePercent(val, totalVal) }; })
                    .OrderByDescending(x => x.Amount).ToList(),
                ByLocation = rows.GroupBy(r => r.StorageLocation, StringComparer.OrdinalIgnoreCase)
                    .Select(g => { var val = Math.Round(g.Sum(x => x.StockValue), 2); return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = val, SharePercent = SafePercent(val, totalVal) }; })
                    .OrderByDescending(x => x.Amount).ToList()
            },
            Rows = rows
        };
    }

    public async Task<ReportResponse<StockLedgerReportSummaryDto, StockLedgerReportRowDto>> GetStockLedgerReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var txList = await _farmDb.InventoryTransactions
            .Include(t => t.Product).ThenInclude(p => p!.Category)
            .Include(t => t.Product).ThenInclude(p => p!.Units)
            .AsNoTracking()
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .ToListAsync();

        var filtered = txList.Where(t =>
            (!from.HasValue || t.TransactionDate >= from.Value) &&
            (!to.HasValue || t.TransactionDate <= to.Value) &&
            (!query.ProductId.HasValue || t.ProductId == query.ProductId.Value) &&
            MatchesFilter(t.StorageLocation, query.Location) &&
            MatchesFilter(t.TransactionType, query.TransactionType) &&
            MatchesFilter(t.Product?.Category?.Name, query.Category) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             (t.Product?.Name ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             (t.Product?.Code ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             (t.ReferenceNumber ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             (t.Notes ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 500);
        var totalEntries = filtered.Count;
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalEntries / pageSize));

        var pagedRows = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(t =>
        {
            var unitPrice = t.UnitPrice > 0 ? t.UnitPrice : (t.Product?.StandardCost ?? 0m);
            return new StockLedgerReportRowDto
            {
                Id = t.Id,
                TransactionDate = t.TransactionDate,
                ProductId = t.ProductId,
                ProductCode = t.Product?.Code ?? string.Empty,
                ProductName = t.Product?.Name ?? string.Empty,
                CategoryName = t.Product?.Category?.Name ?? "General",
                Unit = t.Product?.Units?.ShortCode ?? "Units",
                TransactionType = t.TransactionType,
                Quantity = Math.Round(t.Quantity, 2),
                UnitPrice = Math.Round(unitPrice, 2),
                TotalValue = Math.Round(Math.Abs(t.Quantity) * unitPrice, 2),
                BalanceAfterTransaction = Math.Round(t.BalanceAfterTransaction, 2),
                StorageLocation = t.StorageLocation,
                ReferenceType = t.ReferenceType,
                ReferenceNumber = t.ReferenceNumber,
                Notes = t.Notes
            };
        }).ToList();

        var inRows = filtered.Where(t => t.Quantity > 0).ToList();
        var outRows = filtered.Where(t => t.Quantity < 0).ToList();
        var adjRows = filtered.Where(t => t.TransactionType.Contains("Adjust", StringComparison.OrdinalIgnoreCase)).ToList();

        return new ReportResponse<StockLedgerReportSummaryDto, StockLedgerReportRowDto>
        {
            ReportKey = "stock-ledger",
            ReportTitle = "Stock Ledger Report",
            Filters = query,
            Summary = new StockLedgerReportSummaryDto
            {
                TotalEntries = totalEntries,
                TotalStockInQty = Math.Round(inRows.Sum(t => t.Quantity), 2),
                TotalStockOutQty = Math.Round(outRows.Sum(t => Math.Abs(t.Quantity)), 2),
                TotalAdjustmentDeltaQty = Math.Round(adjRows.Sum(t => t.Quantity), 2),
                TotalInwardValue = Math.Round(inRows.Sum(t => t.Quantity * (t.UnitPrice > 0 ? t.UnitPrice : t.Product?.StandardCost ?? 0m)), 2),
                TotalOutwardValue = Math.Round(outRows.Sum(t => Math.Abs(t.Quantity) * (t.UnitPrice > 0 ? t.UnitPrice : t.Product?.StandardCost ?? 0m)), 2),
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            },
            Rows = pagedRows
        };
    }

    public async Task<ReportResponse<PurchaseReportSummaryDto, PurchaseReportRowDto>> GetPurchaseReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var farms = await _farmDb.Farms.AsNoTracking().ToDictionaryAsync(f => (long)f.Id, f => f.FarmName);
        var crops = await _farmDb.Crops.AsNoTracking().ToDictionaryAsync(c => (long)c.Id, c => c.CropName);

        var purchases = await _farmDb.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.Items)
            .AsNoTracking()
            .OrderByDescending(p => p.PurchaseDate)
            .ToListAsync();

        var rows = purchases.Select(p =>
        {
            var supplierName = p.Supplier?.SupplierName ?? p.Supplier?.Name ?? $"Supplier #{p.SupplierId}";
            var farmName = p.FarmId.HasValue ? farms.GetValueOrDefault(p.FarmId.Value) : null;
            var cropName = p.CropId.HasValue ? crops.GetValueOrDefault(p.CropId.Value) : null;
            var itemsSummary = p.Items.Count > 0
                ? string.Join(", ", p.Items.Select(i => $"{i.ProductName} ({i.Quantity} {i.Unit ?? "Units"})"))
                : p.Notes ?? string.Empty;

            return new PurchaseReportRowDto
            {
                Id = p.Id,
                PurchaseNo = p.PurchaseNo,
                PurchaseDate = p.PurchaseDate,
                SupplierId = p.SupplierId,
                SupplierName = supplierName,
                FarmName = farmName,
                CropName = cropName,
                ItemCount = p.Items.Count,
                ItemsSummary = itemsSummary,
                SubTotal = Math.Round(p.SubTotal, 2),
                DiscountAmount = Math.Round(p.DiscountAmount, 2),
                TaxAmount = Math.Round(p.TaxAmount, 2),
                TotalAmount = Math.Round(p.TotalAmount, 2),
                PaidAmount = Math.Round(p.PaidAmount, 2),
                BalanceAmount = Math.Round(p.BalanceAmount, 2),
                PaymentStatus = p.PaymentStatus
            };
        }).Where(r =>
            (!from.HasValue || r.PurchaseDate >= from.Value) &&
            (!to.HasValue || r.PurchaseDate <= to.Value) &&
            MatchesFilter(r.SupplierName, query.Party) &&
            MatchesFilter(r.FarmName, query.Farm) &&
            MatchesFilter(r.CropName, query.Crop) &&
            MatchesFilter(r.PaymentStatus, query.Status) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.PurchaseNo.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.SupplierName.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.ItemsSummary.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
        .ToList();

        var totalAmount = Math.Round(rows.Sum(r => r.TotalAmount), 2);

        return new ReportResponse<PurchaseReportSummaryDto, PurchaseReportRowDto>
        {
            ReportKey = "purchases",
            ReportTitle = "Purchase Report",
            Filters = query,
            Summary = new PurchaseReportSummaryDto
            {
                TotalOrders = rows.Count,
                TotalSubTotal = Math.Round(rows.Sum(r => r.SubTotal), 2),
                TotalDiscount = Math.Round(rows.Sum(r => r.DiscountAmount), 2),
                TotalTax = Math.Round(rows.Sum(r => r.TaxAmount), 2),
                TotalAmount = totalAmount,
                TotalPaid = Math.Round(rows.Sum(r => r.PaidAmount), 2),
                TotalBalance = Math.Round(rows.Sum(r => r.BalanceAmount), 2),
                BySupplier = rows.GroupBy(r => r.SupplierName, StringComparer.OrdinalIgnoreCase)
                    .Select(g => { var amt = Math.Round(g.Sum(x => x.TotalAmount), 2); return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, totalAmount) }; })
                    .OrderByDescending(x => x.Amount).ToList(),
                ByMonth = rows.GroupBy(r => new { r.PurchaseDate.Year, r.PurchaseDate.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g =>
                    {
                        var amt = Math.Round(g.Sum(x => x.TotalAmount), 2);
                        return new CategoryBreakdownDto
                        {
                            Category = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
                            Count = g.Count(),
                            Amount = amt,
                            SharePercent = SafePercent(amt, totalAmount)
                        };
                    }).ToList()
            },
            Rows = rows
        };
    }

    public async Task<ReportResponse<ConsumptionReportSummaryDto, ConsumptionReportRowDto>> GetConsumptionReportAsync(ReportQueryParameters query)
    {
        var (from, to) = NormalizeDateRange(query);

        var txList = await _farmDb.InventoryTransactions
            .Include(t => t.Product).ThenInclude(p => p!.Category)
            .Include(t => t.Product).ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(t => (t.TransactionType == "StockOut" || t.TransactionType == "Stock Out" || t.Quantity < 0)
                        && !t.TransactionType.Contains("Transfer", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();

        var rows = txList.Select(t =>
        {
            var qty = Math.Round(Math.Abs(t.Quantity), 2);
            var unitCost = Math.Round(t.UnitPrice > 0 ? t.UnitPrice : (t.Product?.StandardCost ?? 0m), 2);
            return new ConsumptionReportRowDto
            {
                TransactionId = t.Id,
                Date = t.TransactionDate,
                ProductId = t.ProductId,
                ProductCode = t.Product?.Code ?? string.Empty,
                ProductName = t.Product?.Name ?? string.Empty,
                CategoryName = t.Product?.Category?.Name ?? "General",
                Unit = t.Product?.Units?.ShortCode ?? "Units",
                ConsumedQuantity = qty,
                UnitCost = unitCost,
                TotalValue = Math.Round(qty * unitCost, 2),
                StorageLocation = t.StorageLocation,
                ReferenceType = t.ReferenceType,
                ReferenceNumber = t.ReferenceNumber,
                Farm = ExtractTag(t.Notes, "Farm"),
                Crop = ExtractTag(t.Notes, "Crop"),
                Notes = t.Notes
            };
        }).Where(r =>
            (!from.HasValue || r.Date >= from.Value) &&
            (!to.HasValue || r.Date <= to.Value) &&
            (!query.ProductId.HasValue || r.ProductId == query.ProductId.Value) &&
            MatchesFilter(r.CategoryName, query.Category) &&
            MatchesFilter(r.StorageLocation, query.Location) &&
            MatchesFilter(r.Farm, query.Farm) &&
            MatchesFilter(r.Crop, query.Crop) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.ProductName.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.ProductCode.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             (r.Notes ?? string.Empty).Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
        .ToList();

        var totalVal = Math.Round(rows.Sum(r => r.TotalValue), 2);

        List<CategoryBreakdownDto> Breakdown(Func<ConsumptionReportRowDto, string> keyFn) =>
            rows.GroupBy(keyFn, StringComparer.OrdinalIgnoreCase)
                .Select(g =>
                {
                    var amt = Math.Round(g.Sum(x => x.TotalValue), 2);
                    return new CategoryBreakdownDto { Category = g.Key, Count = g.Count(), Amount = amt, SharePercent = SafePercent(amt, totalVal) };
                })
                .OrderByDescending(x => x.Amount).ToList();

        return new ReportResponse<ConsumptionReportSummaryDto, ConsumptionReportRowDto>
        {
            ReportKey = "consumption",
            ReportTitle = "Inventory Consumption Report",
            Filters = query,
            Summary = new ConsumptionReportSummaryDto
            {
                TotalEvents = rows.Count,
                DistinctProducts = rows.Select(r => r.ProductId).Distinct().Count(),
                TotalConsumedQuantity = Math.Round(rows.Sum(r => r.ConsumedQuantity), 2),
                TotalConsumptionValue = totalVal,
                ByProduct = Breakdown(r => r.ProductName),
                ByCategory = Breakdown(r => r.CategoryName),
                ByLocation = Breakdown(r => r.StorageLocation)
            },
            Rows = rows
        };
    }

    public async Task<ReportResponse<LowStockReportSummaryDto, LowStockReportRowDto>> GetLowStockReportAsync(ReportQueryParameters query)
    {
        var inventories = await _farmDb.Inventory
            .Include(i => i.Product).ThenInclude(p => p!.Category)
            .Include(i => i.Product).ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(i => i.Product != null && i.Product.IsActive &&
                        (i.CurrentStock <= 0 || (i.Product.ReorderLevel > 0 && i.CurrentStock <= i.Product.ReorderLevel)))
            .ToListAsync();

        var rows = inventories.Select(i =>
        {
            var prod = i.Product!;
            var cur = Math.Round(i.CurrentStock, 2);
            var min = Math.Round(prod.ReorderLevel, 2);
            var deficit = Math.Round(Math.Max(0m, min - cur), 2);
            var severity = cur <= 0 ? "Out of Stock"
                : (min > 0 && cur <= min * 0.5m ? "Critical Low" : "Low Stock");
            var health = min > 0 ? Math.Min(100m, Math.Round((cur / min) * 100m, 2)) : 0m;

            return new LowStockReportRowDto
            {
                ProductId = i.ProductId,
                ProductCode = prod.Code,
                ProductName = prod.Name,
                CategoryName = prod.Category?.Name ?? "General",
                Unit = prod.Units?.ShortCode ?? "Units",
                StorageLocation = i.StorageLocation,
                CurrentStock = cur,
                ReorderLevel = min,
                DeficitQuantity = deficit,
                StandardCost = Math.Round(prod.StandardCost, 2),
                EstimatedReorderCost = Math.Round(deficit * prod.StandardCost, 2),
                HealthPercent = health,
                Severity = severity
            };
        }).Where(r =>
            MatchesFilter(r.CategoryName, query.Category) &&
            MatchesFilter(r.StorageLocation, query.Location) &&
            MatchesFilter(r.Severity, query.Status) &&
            (string.IsNullOrWhiteSpace(query.Search) ||
             r.ProductName.Contains(query.Search, StringComparison.OrdinalIgnoreCase) ||
             r.ProductCode.Contains(query.Search, StringComparison.OrdinalIgnoreCase)))
        .OrderBy(r => r.Severity == "Out of Stock" ? 0 : r.Severity == "Critical Low" ? 1 : 2)
        .ThenByDescending(r => r.EstimatedReorderCost)
        .ToList();

        return new ReportResponse<LowStockReportSummaryDto, LowStockReportRowDto>
        {
            ReportKey = "low-stock",
            ReportTitle = "Low Stock Report",
            Filters = query,
            Summary = new LowStockReportSummaryDto
            {
                TotalLowStockItems = rows.Count,
                OutOfStockCount = rows.Count(r => r.Severity == "Out of Stock"),
                CriticalLowCount = rows.Count(r => r.Severity == "Critical Low"),
                LowStockCount = rows.Count(r => r.Severity == "Low Stock"),
                TotalDeficitQuantity = Math.Round(rows.Sum(r => r.DeficitQuantity), 2),
                TotalEstimatedReorderCost = Math.Round(rows.Sum(r => r.EstimatedReorderCost), 2)
            },
            Rows = rows
        };
    }

    // =========================================================================
    // CSV EXPORT FOR ALL 26 REPORTS
    // =========================================================================

    public async Task<(string FileName, byte[] Content)?> ExportReportCsvAsync(string reportKey, ReportQueryParameters query)
    {
        var key = reportKey.Trim().ToLowerInvariant();
        string csv;

        switch (key)
        {
            case "daily-income":
            case "monthly-income":
            case "annual-income":
            {
                var data = key == "daily-income" ? await GetDailyIncomeReportAsync(query)
                    : key == "monthly-income" ? await GetMonthlyIncomeReportAsync(query)
                    : await GetAnnualIncomeReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Period", r => r.PeriodLabel), ("Crop Sales Count", r => r.CropSalesCount), ("Crop Sales Revenue", r => r.CropSalesRevenue),
                    ("Other Income Count", r => r.OtherIncomeCount), ("Other Income", r => r.OtherIncome),
                    ("Total Transactions", r => r.TotalTransactions), ("Gross Amount", r => r.GrossAmount), ("Net Amount", r => r.NetAmount),
                    ("Growth %", r => r.GrowthPercent), ("Top Crop", r => r.TopCrop), ("Top Farm", r => r.TopFarm));
                break;
            }
            case "daily-expense":
            case "monthly-expense":
            case "annual-expense":
            {
                var data = key == "daily-expense" ? await GetDailyExpenseReportAsync(query)
                    : key == "monthly-expense" ? await GetMonthlyExpenseReportAsync(query)
                    : await GetAnnualExpenseReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Period", r => r.PeriodLabel), ("Operating Expenses", r => r.OperatingExpenses), ("Labour Wages", r => r.LabourWages),
                    ("Machinery Expenses", r => r.MachineryExpenses), ("Input Purchases", r => r.InputPurchases),
                    ("Total Transactions", r => r.TotalTransactions), ("Total Expense", r => r.TotalExpense),
                    ("Change %", r => r.ChangePercent), ("Top Category", r => r.TopCategory));
                break;
            }
            case "pnl":
            case "profit-loss":
            {
                var data = await GetProfitAndLossReportAsync(query);
                var lines = new List<(string Line, decimal Amount)>
                {
                    ("Crop Sales Revenue", data.CropSalesRevenue),
                    ("Other Farm Income", data.OtherFarmIncome),
                    ("Total Revenue", data.TotalRevenue),
                    ("Operating Expenses", data.OperatingExpenses),
                    ("Labour Wages", data.LabourWages),
                    ("Machinery Expenses", data.MachineryExpenses),
                    ("Input Purchases", data.InputPurchases),
                    ("Loan Interest & Penalties", data.LoanInterestPaid),
                    ("Total Expenses", data.TotalExpenses),
                    ("Net Profit", data.NetProfit)
                };
                csv = BuildCsv(lines, ("Particulars", l => l.Line), ("Amount", l => l.Amount));
                break;
            }
            case "cash-flow":
            {
                var data = await GetCashFlowReportAsync(query);
                csv = BuildCsv(data.MonthlyCashFlow,
                    ("Month", r => r.MonthLabel), ("Cash Inflow", r => r.Inflow), ("Cash Outflow", r => r.Outflow), ("Net Cash Flow", r => r.NetCashFlow));
                break;
            }
            case "receivables":
            {
                var data = await GetReceivablesReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Source", r => r.SourceType), ("Reference No", r => r.ReferenceNo), ("Date", r => r.Date.ToString("yyyy-MM-dd")),
                    ("Party", r => r.Party), ("Farm", r => r.Farm), ("Crop", r => r.Crop),
                    ("Total Amount", r => r.TotalAmount), ("Collected", r => r.CollectedAmount), ("Balance", r => r.BalanceAmount),
                    ("Status", r => r.Status), ("Days Outstanding", r => r.DaysOutstanding), ("Aging Bucket", r => r.AgingBucket));
                break;
            }
            case "payables":
            {
                var data = await GetPayablesReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Source", r => r.SourceType), ("Reference No", r => r.ReferenceNo), ("Date", r => r.Date.ToString("yyyy-MM-dd")),
                    ("Party", r => r.Party), ("Total Amount", r => r.TotalAmount), ("Paid", r => r.PaidAmount), ("Balance", r => r.BalanceAmount),
                    ("Status", r => r.Status), ("Days Pending", r => r.DaysPending), ("Aging Bucket", r => r.AgingBucket));
                break;
            }
            case "crop-income":
            {
                var data = await GetCropIncomeReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Crop", r => r.Crop), ("Sales Count", r => r.SalesCount), ("Sales Revenue", r => r.SalesRevenue),
                    ("Quantity Sold", r => r.TotalQuantitySold), ("Other Income", r => r.OtherIncome),
                    ("Total Income", r => r.TotalIncome), ("Share %", r => r.SharePercent));
                break;
            }
            case "crop-expense":
            {
                var data = await GetCropExpenseReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Crop", r => r.Crop), ("Operating Expenses", r => r.OperatingExpenses), ("Labour Cost", r => r.LabourCost),
                    ("Input Purchases", r => r.InputPurchases), ("Activity Cost", r => r.ActivityCost),
                    ("Total Expense", r => r.TotalExpense), ("Share %", r => r.SharePercent));
                break;
            }
            case "crop-profit":
            {
                var data = await GetCropProfitReportAsync(query);
                csv = BuildCsv(data,
                    ("Crop", r => r.Crop), ("Area (Acres)", r => r.AreaAcres), ("Revenue", r => r.Revenue),
                    ("Expenses", r => r.Expenses), ("Net Profit", r => r.NetProfit), ("Profit Margin %", r => r.ProfitMarginPercent));
                break;
            }
            case "farm-profit":
            {
                var data = await GetFarmProfitReportAsync(query);
                csv = BuildCsv(data,
                    ("Farm", r => r.Farm), ("Area (Acres)", r => r.AreaAcres), ("Revenue", r => r.Revenue),
                    ("Expenses", r => r.Expenses), ("Net Profit", r => r.NetProfit), ("Profit Margin %", r => r.ProfitMarginPercent));
                break;
            }
            case "season-profit":
            {
                var data = await GetSeasonProfitReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Season", r => r.SeasonName), ("Farm", r => r.FarmName), ("Crop", r => r.CropName),
                    ("Sowing Date", r => r.SowingDate.ToString("yyyy-MM-dd")), ("Area (Acres)", r => r.AreaAcres),
                    ("Expected Revenue", r => r.ExpectedRevenue), ("Actual Revenue", r => r.ActualRevenue),
                    ("Total Cost", r => r.TotalCost), ("Net Profit", r => r.NetProfit), ("Margin %", r => r.ProfitMarginPercent), ("Status", r => r.Status));
                break;
            }
            case "acre-cost":
            {
                var data = await GetAcreCostReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Group Type", r => r.GroupType), ("Name", r => r.Name), ("Area (Acres)", r => r.AreaAcres),
                    ("Operating Cost", r => r.OperatingCost), ("Labour Cost", r => r.LabourCost), ("Input Cost", r => r.InputCost),
                    ("Activity Cost", r => r.ActivityCost), ("Total Cost", r => r.TotalCost), ("Cost Per Acre", r => r.CostPerAcre));
                break;
            }
            case "acre-revenue":
            {
                var data = await GetAcreRevenueReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Group Type", r => r.GroupType), ("Name", r => r.Name), ("Area (Acres)", r => r.AreaAcres),
                    ("Sales Revenue", r => r.SalesRevenue), ("Other Income", r => r.OtherIncome),
                    ("Total Revenue", r => r.TotalRevenue), ("Revenue Per Acre", r => r.RevenuePerAcre),
                    ("Sold Qty", r => r.SoldQuantity), ("Yield Per Acre", r => r.YieldPerAcre));
                break;
            }
            case "yield":
            {
                var data = await GetYieldReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Season", r => r.SeasonName), ("Farm", r => r.FarmName), ("Crop", r => r.CropName), ("Unit", r => r.Unit),
                    ("Area (Acres)", r => r.AreaAcres), ("Expected Yield", r => r.ExpectedYield), ("Actual Yield", r => r.ActualYield),
                    ("Sold Qty", r => r.SoldQuantity), ("Variance", r => r.YieldVariance), ("Achievement %", r => r.YieldAchievementPercent),
                    ("Yield Per Acre", r => r.YieldPerAcre), ("Status", r => r.Status));
                break;
            }
            case "labour-cost":
            {
                var data = await GetLabourCostReportAsync(query);
                csv = BuildCsv(data.ByWorker,
                    ("Worker Code", r => r.LabourCode), ("Worker Name", r => r.LabourName), ("Daily Rate", r => r.DailyRate),
                    ("Days", r => r.AttendanceDays), ("Units Worked", r => r.TotalUnitsWorked),
                    ("Earned Wages", r => r.EarnedWages), ("Paid Wages", r => r.PaidWages), ("Balance", r => r.BalanceWages), ("Status", r => r.Status));
                break;
            }
            case "input-cost":
            {
                var data = await GetInputCostReportAsync(query);
                csv = BuildCsv(data.ByCategory,
                    ("Category", r => r.Category), ("Count", r => r.Count), ("Amount", r => r.Amount), ("Share %", r => r.SharePercent));
                break;
            }
            case "machinery-cost":
            {
                var data = await GetMachineryCostReportAsync(query);
                csv = BuildCsv(data.Expenses,
                    ("Date", r => r.Date.ToString("yyyy-MM-dd")), ("Machine", r => r.MachineName), ("Expense Type", r => r.ExpenseType),
                    ("Amount", r => r.Amount), ("Operator", r => r.Operator), ("Remarks", r => r.Remarks));
                break;
            }
            case "stock":
            {
                var data = await GetStockReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Product Code", r => r.ProductCode), ("Product Name", r => r.ProductName), ("Category", r => r.CategoryName),
                    ("Unit", r => r.Unit), ("Location", r => r.StorageLocation), ("Current Stock", r => r.CurrentStock),
                    ("Reserved", r => r.ReservedStock), ("Available", r => r.AvailableStock), ("Reorder Level", r => r.ReorderLevel),
                    ("Standard Cost", r => r.StandardCost), ("Stock Value", r => r.StockValue), ("Status", r => r.StockStatus));
                break;
            }
            case "stock-ledger":
            {
                query.PageSize = 500;
                var data = await GetStockLedgerReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Date", r => r.TransactionDate.ToString("yyyy-MM-dd HH:mm")), ("Product Code", r => r.ProductCode),
                    ("Product Name", r => r.ProductName), ("Type", r => r.TransactionType), ("Quantity", r => r.Quantity),
                    ("Unit", r => r.Unit), ("Unit Price", r => r.UnitPrice), ("Total Value", r => r.TotalValue),
                    ("Balance After", r => r.BalanceAfterTransaction), ("Location", r => r.StorageLocation),
                    ("Ref Type", r => r.ReferenceType), ("Ref No", r => r.ReferenceNumber), ("Notes", r => r.Notes));
                break;
            }
            case "purchases":
            {
                var data = await GetPurchaseReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Purchase No", r => r.PurchaseNo), ("Date", r => r.PurchaseDate.ToString("yyyy-MM-dd")),
                    ("Supplier", r => r.SupplierName), ("Farm", r => r.FarmName), ("Crop", r => r.CropName),
                    ("Items", r => r.ItemsSummary), ("SubTotal", r => r.SubTotal), ("Discount", r => r.DiscountAmount),
                    ("Tax", r => r.TaxAmount), ("Total Amount", r => r.TotalAmount), ("Paid", r => r.PaidAmount),
                    ("Balance", r => r.BalanceAmount), ("Status", r => r.PaymentStatus));
                break;
            }
            case "consumption":
            {
                var data = await GetConsumptionReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Date", r => r.Date.ToString("yyyy-MM-dd")), ("Product Code", r => r.ProductCode), ("Product Name", r => r.ProductName),
                    ("Category", r => r.CategoryName), ("Consumed Qty", r => r.ConsumedQuantity), ("Unit", r => r.Unit),
                    ("Unit Cost", r => r.UnitCost), ("Total Value", r => r.TotalValue), ("Location", r => r.StorageLocation),
                    ("Farm", r => r.Farm), ("Crop", r => r.Crop), ("Notes", r => r.Notes));
                break;
            }
            case "low-stock":
            {
                var data = await GetLowStockReportAsync(query);
                csv = BuildCsv(data.Rows,
                    ("Product Code", r => r.ProductCode), ("Product Name", r => r.ProductName), ("Category", r => r.CategoryName),
                    ("Location", r => r.StorageLocation), ("Current Stock", r => r.CurrentStock), ("Reorder Level", r => r.ReorderLevel),
                    ("Deficit", r => r.DeficitQuantity), ("Unit", r => r.Unit), ("Standard Cost", r => r.StandardCost),
                    ("Est. Reorder Cost", r => r.EstimatedReorderCost), ("Health %", r => r.HealthPercent), ("Severity", r => r.Severity));
                break;
            }
            default:
                return null;
        }

        var bytes = new UTF8Encoding(true).GetBytes(csv);
        var fileName = $"agriman_report_{key}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return (fileName, bytes);
    }

    private static string BuildCsv<T>(IEnumerable<T> rows, params (string Header, Func<T, object?> Selector)[] columns)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns.Select(c => EscapeCsv(c.Header))));
        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(",", columns.Select(c => EscapeCsv(Convert.ToString(c.Selector(row), CultureInfo.InvariantCulture) ?? string.Empty))));
        }
        return sb.ToString();
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
