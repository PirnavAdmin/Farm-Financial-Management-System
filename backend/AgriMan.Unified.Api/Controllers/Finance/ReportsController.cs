using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using AgriMan.Expenses.Api.Data;
using SalesApi.Data;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("11. Finance, Bank Accounts & Reports (Module 11)")]
    public class ReportsController : ControllerBase
    {
        private readonly FarmDbContext _farmDb;
        private readonly ExpenseDbContext _expenseDb;
        private readonly SalesDbContext _salesDb;

        public ReportsController(FarmDbContext farmDb, ExpenseDbContext expenseDb, SalesDbContext salesDb)
        {
            _farmDb = farmDb;
            _expenseDb = expenseDb;
            _salesDb = salesDb;
        }

        // GET: api/Reports/pnl
        [HttpGet("pnl")]
        public async Task<IActionResult> GetProfitAndLoss([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var salesQuery = _salesDb.Sales.AsQueryable();
            var incomeQuery = _farmDb.IncomeTransactions.AsQueryable();
            var expenseQuery = _expenseDb.ExpenseTransactions.AsQueryable();

            if (fromDate.HasValue)
            {
                salesQuery = salesQuery.Where(s => s.SalesDate >= fromDate.Value);
                incomeQuery = incomeQuery.Where(i => i.IncomeDate >= fromDate.Value);
                expenseQuery = expenseQuery.Where(e => e.ExpenseDate >= fromDate.Value);
            }
            if (toDate.HasValue)
            {
                salesQuery = salesQuery.Where(s => s.SalesDate <= toDate.Value);
                incomeQuery = incomeQuery.Where(i => i.IncomeDate <= toDate.Value);
                expenseQuery = expenseQuery.Where(e => e.ExpenseDate <= toDate.Value);
            }

            var totalSales = await salesQuery.SumAsync(s => s.NetAmount);
            var otherIncome = await incomeQuery.SumAsync(i => i.NetAmount);
            var totalRevenue = totalSales + otherIncome;

            var totalOperatingExpenses = await expenseQuery.SumAsync(e => e.Amount);
            var totalLabourCost = await _farmDb.LabourPayments.SumAsync(l => l.AmountPaid);
            var totalExpenses = totalOperatingExpenses + totalLabourCost;

            var netProfit = totalRevenue - totalExpenses;
            var marginPercent = totalRevenue > 0 ? Math.Round((netProfit / totalRevenue) * 100, 2) : 0;

            return Ok(new
            {
                TotalRevenue = totalRevenue,
                CropSalesRevenue = totalSales,
                OtherFarmIncome = otherIncome,
                TotalExpenses = totalExpenses,
                OperatingExpenses = totalOperatingExpenses,
                LabourWages = totalLabourCost,
                NetProfit = netProfit,
                ProfitMarginPercent = marginPercent,
                Period = new { From = fromDate, To = toDate }
            });
        }

        // GET: api/Reports/cash-flow
        [HttpGet("cash-flow")]
        public async Task<IActionResult> GetCashFlow([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var receiptsQuery = _farmDb.FinanceReceipts.AsNoTracking().AsQueryable();
            var paymentsQuery = _farmDb.FinancePayments.AsNoTracking().AsQueryable();

            if (fromDate.HasValue)
            {
                receiptsQuery = receiptsQuery.Where(r => r.Date >= fromDate.Value.Date);
                paymentsQuery = paymentsQuery.Where(p => p.Date >= fromDate.Value.Date);
            }
            if (toDate.HasValue)
            {
                var endExclusive = toDate.Value.Date.AddDays(1);
                receiptsQuery = receiptsQuery.Where(r => r.Date < endExclusive);
                paymentsQuery = paymentsQuery.Where(p => p.Date < endExclusive);
            }

            var receipts = await receiptsQuery.OrderByDescending(r => r.Date).ToListAsync();
            var payments = await paymentsQuery.OrderByDescending(p => p.Date).ToListAsync();

            var totalInflow = receipts
                .Where(r => string.Equals(r.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                .Sum(r => r.FinalAmount > 0 ? r.FinalAmount : r.Amount);

            var totalOutflow = payments
                .Where(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                .Sum(p => p.TotalAmount > 0 ? p.TotalAmount : p.Amount);

            var pendingInflow = receipts
                .Where(r => string.Equals(r.Status, "Pending", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(r.Status, "Processing", StringComparison.OrdinalIgnoreCase))
                .Sum(r => r.FinalAmount > 0 ? r.FinalAmount : r.Amount);

            var pendingOutflow = payments
                .Where(p => string.Equals(p.Status, "Pending", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(p.Status, "Processing", StringComparison.OrdinalIgnoreCase))
                .Sum(p => p.TotalAmount > 0 ? p.TotalAmount : p.Amount);

            var netCashFlow = Math.Round(totalInflow - totalOutflow, 2);

            var recentReceipts = receipts
                .Where(r => !string.Equals(r.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                .Take(10)
                .ToList();

            var recentPayments = payments
                .Where(p => !string.Equals(p.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                .Take(10)
                .ToList();

            return Ok(new
            {
                TotalCashInflow = Math.Round(totalInflow, 2),
                TotalCashOutflow = Math.Round(totalOutflow, 2),
                NetCashFlow = netCashFlow,
                PendingCashInflow = Math.Round(pendingInflow, 2),
                PendingCashOutflow = Math.Round(pendingOutflow, 2),
                RecentReceipts = recentReceipts,
                RecentPayments = recentPayments
            });
        }

        // GET: api/Reports/crop-profit
        [HttpGet("crop-profit")]
        public async Task<IActionResult> GetCropProfit()
        {
            // Revenue by crop from sales
            var cropSales = await _salesDb.Sales
                .GroupBy(s => s.Crop)
                .Select(g => new { Crop = g.Key, Revenue = g.Sum(s => s.NetAmount) })
                .ToListAsync();

            // Expenses by crop from expense transactions
            var cropExpenses = await _expenseDb.ExpenseTransactions
                .Where(e => !string.IsNullOrEmpty(e.Crop))
                .GroupBy(e => e.Crop)
                .Select(g => new { Crop = g.Key, Expenses = g.Sum(e => e.Amount) })
                .ToListAsync();

            var allCrops = cropSales.Select(s => s.Crop)
                .Union(cropExpenses.Select(e => e.Crop))
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Distinct()
                .ToList();

            var result = allCrops.Select(crop =>
            {
                var rev = cropSales.FirstOrDefault(s => s.Crop == crop)?.Revenue ?? 0;
                var exp = cropExpenses.FirstOrDefault(e => e.Crop == crop)?.Expenses ?? 0;
                var profit = rev - exp;
                var margin = rev > 0 ? Math.Round((profit / rev) * 100, 2) : 0;
                return new
                {
                    Crop = crop,
                    Revenue = rev,
                    Expenses = exp,
                    NetProfit = profit,
                    ProfitMarginPercent = margin
                };
            }).OrderByDescending(c => c.NetProfit).ToList();

            return Ok(result);
        }

        // GET: api/Reports/farm-profit
        [HttpGet("farm-profit")]
        public async Task<IActionResult> GetFarmProfit()
        {
            var farmSales = await _salesDb.Sales
                .GroupBy(s => s.Farm)
                .Select(g => new { Farm = g.Key, Revenue = g.Sum(s => s.NetAmount) })
                .ToListAsync();

            var farmExpenses = await _expenseDb.ExpenseTransactions
                .Where(e => !string.IsNullOrEmpty(e.Farm))
                .GroupBy(e => e.Farm)
                .Select(g => new { Farm = g.Key, Expenses = g.Sum(e => e.Amount) })
                .ToListAsync();

            var allFarms = farmSales.Select(s => s.Farm)
                .Union(farmExpenses.Select(e => e.Farm))
                .Where(f => !string.IsNullOrWhiteSpace(f))
                .Distinct()
                .ToList();

            var result = allFarms.Select(farm =>
            {
                var rev = farmSales.FirstOrDefault(s => s.Farm == farm)?.Revenue ?? 0;
                var exp = farmExpenses.FirstOrDefault(e => e.Farm == farm)?.Expenses ?? 0;
                var profit = rev - exp;
                var margin = rev > 0 ? Math.Round((profit / rev) * 100, 2) : 0;
                return new
                {
                    Farm = farm,
                    Revenue = rev,
                    Expenses = exp,
                    NetProfit = profit,
                    ProfitMarginPercent = margin
                };
            }).OrderByDescending(f => f.NetProfit).ToList();

            return Ok(result);
        }
    }
}
