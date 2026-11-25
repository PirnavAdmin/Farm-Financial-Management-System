using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using AgriMan.Expenses.Api.Data;
using AgriMan.Unified.Api.DTOs.Crops;
using AgriMan.Unified.Api.Services.Crops;
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
        private readonly ICropProfitabilityService _cropProfitability;

        public ReportsController(
            FarmDbContext farmDb,
            ExpenseDbContext expenseDb,
            SalesDbContext salesDb,
            ICropProfitabilityService? cropProfitability = null)
        {
            _farmDb = farmDb;
            _expenseDb = expenseDb;
            _salesDb = salesDb;
            _cropProfitability = cropProfitability ?? new CropProfitabilityService(farmDb, expenseDb, salesDb);
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
            var receiptsQuery = _farmDb.FinanceReceipts.AsQueryable();
            var paymentsQuery = _farmDb.FinancePayments.AsQueryable();

            if (fromDate.HasValue)
            {
                receiptsQuery = receiptsQuery.Where(r => r.Date >= fromDate.Value);
                paymentsQuery = paymentsQuery.Where(p => p.Date >= fromDate.Value);
            }
            if (toDate.HasValue)
            {
                receiptsQuery = receiptsQuery.Where(r => r.Date <= toDate.Value);
                paymentsQuery = paymentsQuery.Where(p => p.Date <= toDate.Value);
            }

            var totalInflow = await receiptsQuery.SumAsync(r => r.Amount);
            var totalOutflow = await paymentsQuery.SumAsync(p => p.Amount);
            var netCashFlow = totalInflow - totalOutflow;

            var recentReceipts = await receiptsQuery.OrderByDescending(r => r.Date).Take(10).ToListAsync();
            var recentPayments = await paymentsQuery.OrderByDescending(p => p.Date).Take(10).ToListAsync();

            return Ok(new
            {
                TotalCashInflow = totalInflow,
                TotalCashOutflow = totalOutflow,
                NetCashFlow = netCashFlow,
                RecentReceipts = recentReceipts,
                RecentPayments = recentPayments
            });
        }

        // GET: api/Reports/crop-profit
        // GET: api/Reports/crop-wise-pnl
        [HttpGet("crop-profit")]
        [HttpGet("crop-wise-pnl")]
        public async Task<IActionResult> GetCropProfit(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? farm = null,
            [FromQuery] string? season = null)
        {
            var cropsMaster = await _farmDb.Crops.AsNoTracking().ToListAsync();
            var cropSeasonsQuery = _farmDb.CropSeasons
                .Include(cs => cs.Crop)
                .Include(cs => cs.Farm)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(farm))
            {
                var farmLower = farm.Trim().ToLower();
                cropSeasonsQuery = cropSeasonsQuery.Where(cs => cs.Farm != null && cs.Farm.FarmName.ToLower().Contains(farmLower));
            }
            if (!string.IsNullOrWhiteSpace(season))
            {
                var seasonLower = season.Trim().ToLower();
                cropSeasonsQuery = cropSeasonsQuery.Where(cs => cs.SeasonName.ToLower().Contains(seasonLower));
            }
            var cropSeasons = await cropSeasonsQuery.ToListAsync();

            var salesQuery = _salesDb.Sales.AsNoTracking().AsQueryable();
            var incomeQuery = _farmDb.IncomeTransactions
                .Include(i => i.Category)
                .Include(i => i.Items)
                .AsNoTracking()
                .Where(i => i.Status != "Cancelled");
            var expenseQuery = _expenseDb.ExpenseTransactions
                .AsNoTracking()
                .Where(e => e.Status != "Cancelled");
            var labourQuery = _farmDb.LabourAttendances.AsNoTracking().AsQueryable();

            if (fromDate.HasValue)
            {
                salesQuery = salesQuery.Where(s => s.SalesDate >= fromDate.Value);
                incomeQuery = incomeQuery.Where(i => i.IncomeDate >= fromDate.Value);
                expenseQuery = expenseQuery.Where(e => e.ExpenseDate >= fromDate.Value);
                labourQuery = labourQuery.Where(l => l.AttendanceDate >= fromDate.Value);
            }
            if (toDate.HasValue)
            {
                var inclusiveEnd = toDate.Value.Date.AddDays(1).AddTicks(-1);
                salesQuery = salesQuery.Where(s => s.SalesDate <= inclusiveEnd);
                incomeQuery = incomeQuery.Where(i => i.IncomeDate <= inclusiveEnd);
                expenseQuery = expenseQuery.Where(e => e.ExpenseDate <= inclusiveEnd);
                labourQuery = labourQuery.Where(l => l.AttendanceDate <= inclusiveEnd);
            }
            if (!string.IsNullOrWhiteSpace(farm))
            {
                var farmLower = farm.Trim().ToLower();
                salesQuery = salesQuery.Where(s => s.Farm.ToLower().Contains(farmLower));
                incomeQuery = incomeQuery.Where(i => i.Farm.ToLower().Contains(farmLower));
                expenseQuery = expenseQuery.Where(e => e.Farm.ToLower().Contains(farmLower));
                labourQuery = labourQuery.Where(l => l.FarmName.ToLower().Contains(farmLower));
            }
            if (!string.IsNullOrWhiteSpace(season))
            {
                var seasonLower = season.Trim().ToLower();
                incomeQuery = incomeQuery.Where(i => i.Remarks != null && i.Remarks.ToLower().Contains(seasonLower));
                expenseQuery = expenseQuery.Where(e => e.Remarks != null && e.Remarks.ToLower().Contains(seasonLower));
            }

            var sales = await salesQuery.ToListAsync();
            var incomes = await incomeQuery.ToListAsync();
            var expenses = await expenseQuery.ToListAsync();
            var labourLogs = await labourQuery.ToListAsync();

            static string NormalizeCropKey(string? name) =>
                string.IsNullOrWhiteSpace(name) ? string.Empty : name.Trim().ToLowerInvariant();

            static decimal ToKg(decimal quantity, string? unit)
            {
                if (quantity <= 0) return 0m;
                var u = (unit ?? string.Empty).Trim().ToLowerInvariant();
                if (u is "kg" or "kgs" or "kilogram" or "kilograms") return quantity;
                if (u is "quintal" or "quintals" or "qtl" or "qtls") return quantity * 100m;
                if (u is "tonne" or "tonnes" or "ton" or "tons" or "mt") return quantity * 1000m;
                if (u is "gram" or "grams" or "g" or "gm") return quantity / 1000m;
                if (u is "bag" or "bags") return quantity * 50m;
                return 0m;
            }

            static string MapExpenseBucket(string? rawCategory, string? description)
            {
                var combined = $"{rawCategory} {description}".Trim().ToLowerInvariant();
                if (combined.Contains("seed") || combined.Contains("sapling") || combined.Contains("nursery")) return "Seeds";
                if (combined.Contains("fertilizer") || combined.Contains("fertiliser") || combined.Contains("urea") || combined.Contains("dap") || combined.Contains("potash") || combined.Contains("manure") || combined.Contains("compost")) return "Fertilizer";
                if (combined.Contains("pesticide") || combined.Contains("herbicide") || combined.Contains("fungicide") || combined.Contains("insecticide") || combined.Contains("crop protection")) return "Pesticides";
                if (combined.Contains("labour") || combined.Contains("labor") || combined.Contains("wage") || combined.Contains("weeding") || combined.Contains("harvesting") || combined.Contains("worker")) return "Labour";
                if (combined.Contains("diesel") || combined.Contains("fuel") || combined.Contains("petrol")) return "Diesel";
                if (combined.Contains("machinery") || combined.Contains("tractor") || combined.Contains("rotavator") || combined.Contains("harvester") || combined.Contains("equipment")) return "Machinery";
                if (combined.Contains("transport") || combined.Contains("haulage") || combined.Contains("freight") || combined.Contains("cartage")) return "Transport";
                return string.IsNullOrWhiteSpace(rawCategory) ? "Other" : rawCategory.Trim();
            }

            var displayNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            void RegisterName(string? name)
            {
                var key = NormalizeCropKey(name);
                if (!string.IsNullOrEmpty(key) && !displayNames.ContainsKey(key))
                {
                    displayNames[key] = name!.Trim();
                }
            }

            foreach (var c in cropsMaster) RegisterName(c.CropName);
            foreach (var cs in cropSeasons) RegisterName(cs.Crop?.CropName);
            foreach (var s in sales) RegisterName(s.Crop);
            foreach (var i in incomes) RegisterName(i.Crop);
            foreach (var e in expenses) RegisterName(e.Crop);
            foreach (var l in labourLogs) RegisterName(l.CropName);

            var allKeys = displayNames.Keys.ToList();
            if (!string.IsNullOrWhiteSpace(crop))
            {
                var filterLower = crop.Trim().ToLowerInvariant();
                allKeys = allKeys.Where(k => k.Contains(filterLower)).ToList();
            }

            var result = new List<(decimal NetProfit, object Payload)>();
            foreach (var key in allKeys)
            {
                var displayName = displayNames[key];
                var masterCrop = cropsMaster.FirstOrDefault(c => NormalizeCropKey(c.CropName) == key);
                var matchedSeasons = cropSeasons.Where(cs => NormalizeCropKey(cs.Crop?.CropName) == key).ToList();
                var matchedSales = sales.Where(s => NormalizeCropKey(s.Crop) == key).ToList();
                var matchedIncomes = incomes.Where(i => NormalizeCropKey(i.Crop) == key).ToList();
                var matchedExpenses = expenses.Where(e => NormalizeCropKey(e.Crop) == key).ToList();
                var matchedLabour = labourLogs.Where(l => NormalizeCropKey(l.CropName) == key).ToList();

                // Exclude pure master crops that have zero activity when no seasons/transactions exist
                if (matchedSeasons.Count == 0 && matchedSales.Count == 0 && matchedIncomes.Count == 0 && matchedExpenses.Count == 0 && matchedLabour.Count == 0)
                {
                    continue;
                }

                var areaAcres = matchedSeasons.Sum(cs => cs.AreaAcres);
                var farmsList = matchedSeasons.Select(cs => cs.Farm?.FarmName)
                    .Concat(matchedSales.Select(s => s.Farm))
                    .Concat(matchedIncomes.Select(i => i.Farm))
                    .Concat(matchedExpenses.Select(e => e.Farm))
                    .Where(f => !string.IsNullOrWhiteSpace(f))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                var seasonsList = matchedSeasons.Select(cs => cs.SeasonName)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                // Income aggregation
                var salesRevenue = matchedSales.Sum(s => s.NetAmount);
                var incomeByCategory = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
                if (salesRevenue > 0)
                {
                    incomeByCategory["Crop Sales"] = salesRevenue;
                }

                decimal incomeSoldKg = 0m;
                foreach (var inc in matchedIncomes)
                {
                    var catName = inc.Category?.Name?.Trim();
                    if (string.IsNullOrWhiteSpace(catName)) catName = "Crop Sales";
                    incomeByCategory[catName] = incomeByCategory.GetValueOrDefault(catName) + inc.NetAmount;

                    foreach (var item in inc.Items)
                    {
                        incomeSoldKg += ToKg(item.Quantity, item.Unit);
                    }
                }

                var cropSalesTotal = incomeByCategory
                    .Where(kv => kv.Key.Contains("crop", StringComparison.OrdinalIgnoreCase) || kv.Key.Contains("sale", StringComparison.OrdinalIgnoreCase))
                    .Sum(kv => kv.Value);
                var totalIncome = incomeByCategory.Values.Sum();
                var otherIncomeTotal = totalIncome - cropSalesTotal;

                // Expense aggregation
                var expenseBuckets = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Seeds"] = 0m,
                    ["Fertilizer"] = 0m,
                    ["Pesticides"] = 0m,
                    ["Labour"] = 0m,
                    ["Diesel"] = 0m,
                    ["Machinery"] = 0m,
                    ["Transport"] = 0m
                };
                var extraExpenseCategories = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

                foreach (var exp in matchedExpenses)
                {
                    var bucket = MapExpenseBucket(exp.ExpenseCategory, exp.Description);
                    if (expenseBuckets.ContainsKey(bucket))
                    {
                        expenseBuckets[bucket] += exp.Amount;
                    }
                    else
                    {
                        extraExpenseCategories[bucket] = extraExpenseCategories.GetValueOrDefault(bucket) + exp.Amount;
                    }
                }

                // Fallback to LabourAttendance if no Labour expense transaction was recorded for this crop
                if (expenseBuckets["Labour"] == 0m && matchedLabour.Count > 0)
                {
                    expenseBuckets["Labour"] = matchedLabour.Sum(l => l.Amount > 0 ? l.Amount : l.CalculatedAmount);
                }

                var totalExpenses = expenseBuckets.Values.Sum() + extraExpenseCategories.Values.Sum();
                var netProfit = totalIncome - totalExpenses;

                // Quantity in Kg (Sales + Income items, falling back to CropSeason ActualYield if available)
                var soldQuantityKg = matchedSales.Sum(s => ToKg(s.Quantity, s.Unit)) + incomeSoldKg;
                var yieldQuantityKg = matchedSeasons.Sum(cs => ToKg(cs.ActualYield ?? 0m, masterCrop?.DefaultUnit ?? "Quintals"));
                var effectiveKg = soldQuantityKg > 0m ? soldQuantityKg : yieldQuantityKg;

                decimal? costPerAcre = areaAcres > 0m ? Math.Round(totalExpenses / areaAcres, 2) : null;
                decimal? incomePerAcre = areaAcres > 0m ? Math.Round(totalIncome / areaAcres, 2) : null;
                decimal? profitPerAcre = areaAcres > 0m ? Math.Round(netProfit / areaAcres, 2) : null;
                decimal? costPerKg = effectiveKg > 0m ? Math.Round(totalExpenses / effectiveKg, 2) : null;
                decimal? sellingPricePerKg = soldQuantityKg > 0m
                    ? Math.Round((cropSalesTotal > 0m ? cropSalesTotal : totalIncome) / soldQuantityKg, 2)
                    : (effectiveKg > 0m && totalIncome > 0m ? Math.Round(totalIncome / effectiveKg, 2) : null);
                decimal? roiPercent = totalExpenses > 0m ? Math.Round((netProfit / totalExpenses) * 100m, 2) : null;
                var profitMarginPercent = totalIncome > 0m ? Math.Round((netProfit / totalIncome) * 100m, 2) : 0m;

                var otherExpenseTotal = extraExpenseCategories.Values.Sum();
                var expenseItemsList = expenseBuckets
                    .Select(kv => new { category = kv.Key, amount = kv.Value })
                    .Concat(extraExpenseCategories.OrderByDescending(kv => kv.Value).Select(kv => new { category = kv.Key, amount = kv.Value }))
                    .ToList();

                result.Add((netProfit, new
                {
                    crop = displayName,
                    cropCode = masterCrop?.CropCode ?? string.Empty,
                    cropType = masterCrop?.CropType ?? string.Empty,
                    areaAcres,
                    farms = farmsList,
                    seasons = seasonsList,
                    revenue = totalIncome,
                    totalIncome,
                    expenses = totalExpenses,
                    totalExpenses,
                    netProfit,
                    profitMarginPercent,
                    roiPercent,
                    costPerAcre,
                    incomePerAcre,
                    profitPerAcre,
                    costPerKg,
                    sellingPricePerKg,
                    totalQuantityKg = effectiveKg,
                    soldQuantityKg,
                    incomeBreakdown = new
                    {
                        cropSales = cropSalesTotal,
                        otherIncome = otherIncomeTotal,
                        items = incomeByCategory.OrderByDescending(kv => kv.Value).Select(kv => new { category = kv.Key, amount = kv.Value }).ToList()
                    },
                    expenseBreakdown = new
                    {
                        seeds = expenseBuckets["Seeds"],
                        fertilizer = expenseBuckets["Fertilizer"],
                        pesticides = expenseBuckets["Pesticides"],
                        labour = expenseBuckets["Labour"],
                        diesel = expenseBuckets["Diesel"],
                        machinery = expenseBuckets["Machinery"],
                        transport = expenseBuckets["Transport"],
                        other = otherExpenseTotal,
                        items = expenseItemsList
                    },
                    counts = new
                    {
                        sales = matchedSales.Count,
                        income = matchedIncomes.Count,
                        expenses = matchedExpenses.Count,
                        labourLogs = matchedLabour.Count
                    }
                }));
            }

            var ordered = result.OrderByDescending(r => r.NetProfit).Select(r => r.Payload).ToList();
            return Ok(ordered);
        }

        // GET: api/Reports/crop-profitability
        [HttpGet("crop-profitability")]
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

        // GET: api/Reports/crop-profitability/{cropName}
        [HttpGet("crop-profitability/{cropName}")]
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
