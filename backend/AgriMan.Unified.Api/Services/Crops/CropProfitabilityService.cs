using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AgriMan.Expenses.Api.Data;
using AgriMan.Unified.Api.DTOs.Crops;
using FarmManagementApi.Data;
using FarmManagementApi.Models;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;
using SalesApi.Models;

namespace AgriMan.Unified.Api.Services.Crops;

public class CropProfitabilityService : ICropProfitabilityService
{
    private static readonly CultureInfo IndianCulture = new("en-IN");

    private static readonly string[] CoreExpenseOrder =
    {
        "Seeds",
        "Fertilizer",
        "Pesticides",
        "Labour",
        "Diesel",
        "Machinery",
        "Transport"
    };

    private static readonly Regex ParentheticalRegex = new(@"\s*\([^)]*\)\s*", RegexOptions.Compiled);

    private readonly FarmDbContext _farmDb;
    private readonly ExpenseDbContext _expenseDb;
    private readonly SalesDbContext _salesDb;

    public CropProfitabilityService(
        FarmDbContext farmDb,
        ExpenseDbContext expenseDb,
        SalesDbContext salesDb)
    {
        _farmDb = farmDb;
        _expenseDb = expenseDb;
        _salesDb = salesDb;
    }

    public async Task<CropProfitabilityOverviewDto> GetAllCropsProfitabilityAsync(
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var items = await BuildCropProfitabilityListAsync(parameters, cancellationToken);

        // Apply optional area/quantity overrides only if scoped to a single crop
        if (items.Count == 1 && (!string.IsNullOrWhiteSpace(parameters.Crop) || parameters.CropId.HasValue))
        {
            items[0] = ApplyOptionalOverrides(items[0], parameters);
        }

        var summary = BuildSummaryTotals(items);

        return new CropProfitabilityOverviewDto
        {
            GeneratedAtUtc = DateTime.UtcNow,
            Filters = new CropProfitabilityAppliedFiltersDto
            {
                Crop = string.IsNullOrWhiteSpace(parameters.Crop) ? null : parameters.Crop.Trim(),
                CropId = parameters.CropId,
                Farm = string.IsNullOrWhiteSpace(parameters.Farm) ? null : parameters.Farm.Trim(),
                FarmId = parameters.FarmId,
                Season = string.IsNullOrWhiteSpace(parameters.Season) ? null : parameters.Season.Trim(),
                SeasonId = parameters.SeasonId,
                FromDate = parameters.FromDate,
                ToDate = parameters.ToDate,
                IncludeLabourAttendance = parameters.IncludeLabourAttendance,
                IncludeCropActivities = parameters.IncludeCropActivities
            },
            Summary = summary,
            Crops = items
        };
    }

    public async Task<CropProfitabilityItemDto?> GetCropProfitabilityByNameAsync(
        string cropName,
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cropName))
        {
            return null;
        }

        parameters.Crop = cropName.Trim();
        var items = await BuildCropProfitabilityListAsync(parameters, cancellationToken);
        var item = items.FirstOrDefault();
        if (item == null)
        {
            return null;
        }

        return ApplyOptionalOverrides(item, parameters);
    }

    public async Task<CropProfitabilityItemDto?> GetCropProfitabilityByIdAsync(
        int cropId,
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        parameters.CropId = cropId;
        var items = await BuildCropProfitabilityListAsync(parameters, cancellationToken);
        var item = items.FirstOrDefault();
        if (item == null)
        {
            return null;
        }

        return ApplyOptionalOverrides(item, parameters);
    }

    public CropProfitabilityItemDto CalculateScenario(CropProfitabilityCalculationRequest request)
    {
        var cropName = request.Crop.Trim();
        var area = Math.Max(0m, request.AreaAcres);
        var quantityKg = Math.Max(0m, request.QuantityKg);

        var incomeBreakdown = new List<CropFinancialLineItemDto>();
        if (request.CropSales > 0m)
        {
            incomeBreakdown.Add(CreateLineItem("Crop Sales", request.CropSales, 1));
        }
        if (request.OtherIncome > 0m)
        {
            incomeBreakdown.Add(CreateLineItem("Other Income", request.OtherIncome, 1));
        }

        var totalIncome = Math.Round(request.CropSales + request.OtherIncome, 2);

        var expenseDict = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["Seeds"] = Math.Round(request.Seeds, 2),
            ["Fertilizer"] = Math.Round(request.Fertilizer, 2),
            ["Pesticides"] = Math.Round(request.Pesticides, 2),
            ["Labour"] = Math.Round(request.Labour, 2),
            ["Diesel"] = Math.Round(request.Diesel, 2),
            ["Machinery"] = Math.Round(request.Machinery, 2),
            ["Transport"] = Math.Round(request.Transport, 2)
        };

        decimal otherTotal = Math.Round(request.OtherExpenses, 2);
        var customRows = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        if (otherTotal > 0m)
        {
            customRows["Other"] = otherTotal;
        }

        if (request.AdditionalExpenses != null)
        {
            foreach (var extra in request.AdditionalExpenses)
            {
                if (extra == null || extra.Amount <= 0m || string.IsNullOrWhiteSpace(extra.Category))
                {
                    continue;
                }

                var normalized = NormalizeExpenseCategory(extra.Category, null);
                if (expenseDict.ContainsKey(normalized))
                {
                    expenseDict[normalized] = Math.Round(expenseDict[normalized] + extra.Amount, 2);
                }
                else
                {
                    otherTotal = Math.Round(otherTotal + extra.Amount, 2);
                    customRows[normalized] = Math.Round(customRows.GetValueOrDefault(normalized) + extra.Amount, 2);
                }
            }
        }

        var expenseBreakdown = new List<CropFinancialLineItemDto>();
        foreach (var cat in CoreExpenseOrder)
        {
            var amt = expenseDict[cat];
            expenseBreakdown.Add(CreateLineItem(cat, amt, amt > 0m ? 1 : 0));
        }

        foreach (var kv in customRows.OrderByDescending(x => x.Value))
        {
            if (kv.Value > 0m)
            {
                expenseBreakdown.Add(CreateLineItem(kv.Key, kv.Value, 1));
            }
        }

        var totalExpenses = Math.Round(
            expenseDict.Values.Sum() + otherTotal,
            2);
        var netProfit = Math.Round(totalIncome - totalExpenses, 2);

        return new CropProfitabilityItemDto
        {
            Crop = cropName,
            AreaAcres = Math.Round(area, 2),
            AreaDisplay = FormatArea(area),
            CropSales = Math.Round(request.CropSales, 2),
            GrossCropSales = Math.Round(request.CropSales, 2),
            SalesDeductions = 0m,
            OtherIncome = Math.Round(request.OtherIncome, 2),
            TotalIncome = totalIncome,
            IncomeBreakdown = incomeBreakdown,
            ExpensesByCategory = new CropExpenseCategorySummaryDto
            {
                Seeds = expenseDict["Seeds"],
                Fertilizer = expenseDict["Fertilizer"],
                Pesticides = expenseDict["Pesticides"],
                Labour = expenseDict["Labour"],
                Diesel = expenseDict["Diesel"],
                Machinery = expenseDict["Machinery"],
                Transport = expenseDict["Transport"],
                Other = otherTotal
            },
            ExpenseBreakdown = expenseBreakdown,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            NetProfitFormula = "Total Income - Total Expenses",
            ProfitStatus = DetermineProfitStatus(netProfit),
            SoldQuantityKg = Math.Round(quantityKg, 2),
            PrimarySoldQuantity = Math.Round(quantityKg, 2),
            PrimarySoldUnit = quantityKg > 0m ? "kg" : null,
            Metrics = ComputeMetrics(area, quantityKg, request.CropSales, totalIncome, totalExpenses, netProfit),
            FormattedCropSales = FormatInr(request.CropSales),
            FormattedTotalIncome = FormatInr(totalIncome),
            FormattedTotalExpenses = FormatInr(totalExpenses),
            FormattedNetProfit = FormatInr(netProfit)
        };
    }

    public async Task<string> ExportCsvAsync(
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var overview = await GetAllCropsProfitabilityAsync(parameters, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("Crop,Area (Acres),Crop Sales,Other Income,Total Income,Seeds,Fertilizer,Pesticides,Labour,Diesel,Machinery,Transport,Other Expenses,Total Expenses,Net Profit,Sold Quantity (Kg),Cost / Acre,Income / Acre,Profit / Acre,Cost / Kg,Selling Price / Kg,ROI %");

        foreach (var c in overview.Crops)
        {
            sb.AppendLine(string.Join(",",
                CsvQuote(c.Crop),
                c.AreaAcres.ToString(CultureInfo.InvariantCulture),
                c.CropSales.ToString(CultureInfo.InvariantCulture),
                c.OtherIncome.ToString(CultureInfo.InvariantCulture),
                c.TotalIncome.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Seeds.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Fertilizer.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Pesticides.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Labour.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Diesel.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Machinery.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Transport.ToString(CultureInfo.InvariantCulture),
                c.ExpensesByCategory.Other.ToString(CultureInfo.InvariantCulture),
                c.TotalExpenses.ToString(CultureInfo.InvariantCulture),
                c.NetProfit.ToString(CultureInfo.InvariantCulture),
                c.SoldQuantityKg.ToString(CultureInfo.InvariantCulture),
                c.Metrics.CostPerAcre.ToString(CultureInfo.InvariantCulture),
                c.Metrics.IncomePerAcre.ToString(CultureInfo.InvariantCulture),
                c.Metrics.ProfitPerAcre.ToString(CultureInfo.InvariantCulture),
                c.Metrics.CostPerKg.ToString(CultureInfo.InvariantCulture),
                c.Metrics.SellingPricePerKg.ToString(CultureInfo.InvariantCulture),
                c.Metrics.RoiPercent.ToString(CultureInfo.InvariantCulture)
            ));
        }

        return sb.ToString();
    }

    private async Task<List<CropProfitabilityItemDto>> BuildCropProfitabilityListAsync(
        CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        // Resolve Farm filter if FarmId is specified
        string? resolvedFarmFilter = string.IsNullOrWhiteSpace(parameters.Farm) ? null : parameters.Farm.Trim();
        if (parameters.FarmId.HasValue)
        {
            var farmEntity = await _farmDb.Farms
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == parameters.FarmId.Value, cancellationToken);
            if (farmEntity == null)
            {
                return new List<CropProfitabilityItemDto>();
            }
            if (resolvedFarmFilter == null)
            {
                resolvedFarmFilter = farmEntity.FarmName;
            }
        }

        // Sequential queries on FarmDbContext (EF Core DbContext is not thread-safe for concurrent ops)
        var masterCrops = await _farmDb.Crops
            .AsNoTracking()
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);

        var seasonsQuery = _farmDb.CropSeasons
            .Include(s => s.Crop)
            .Include(s => s.Farm)
            .AsNoTracking()
            .AsQueryable();

        if (parameters.FarmId.HasValue)
        {
            seasonsQuery = seasonsQuery.Where(s => s.FarmId == parameters.FarmId.Value);
        }
        else if (resolvedFarmFilter != null)
        {
            var farmTerm = resolvedFarmFilter.ToLower();
            seasonsQuery = seasonsQuery.Where(s => s.Farm != null && s.Farm.FarmName.ToLower().Contains(farmTerm));
        }

        if (parameters.SeasonId.HasValue)
        {
            seasonsQuery = seasonsQuery.Where(s => s.Id == parameters.SeasonId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(parameters.Season))
        {
            var seasonTerm = parameters.Season.Trim().ToLower();
            seasonsQuery = seasonsQuery.Where(s => s.SeasonName.ToLower().Contains(seasonTerm));
        }

        var seasons = await seasonsQuery.ToListAsync(cancellationToken);

        var fromDate = parameters.FromDate?.Date;
        var toDate = parameters.ToDate?.Date.AddDays(1).AddTicks(-1);

        var incomeQuery = _farmDb.IncomeTransactions
            .Include(t => t.Category)
            .Include(t => t.Items)
            .AsNoTracking()
            .AsQueryable();

        if (fromDate.HasValue) incomeQuery = incomeQuery.Where(t => t.IncomeDate >= fromDate.Value);
        if (toDate.HasValue) incomeQuery = incomeQuery.Where(t => t.IncomeDate <= toDate.Value);
        if (resolvedFarmFilter != null)
        {
            var farmTerm = resolvedFarmFilter.ToLower();
            incomeQuery = incomeQuery.Where(t => t.Farm.ToLower().Contains(farmTerm));
        }

        var incomeTransactions = await incomeQuery.ToListAsync(cancellationToken);

        List<LabourAttendance> labourAttendances = new();
        if (parameters.IncludeLabourAttendance)
        {
            var labourQuery = _farmDb.LabourAttendances.AsNoTracking().AsQueryable();
            if (fromDate.HasValue) labourQuery = labourQuery.Where(l => l.AttendanceDate >= fromDate.Value);
            if (toDate.HasValue) labourQuery = labourQuery.Where(l => l.AttendanceDate <= toDate.Value);
            if (resolvedFarmFilter != null)
            {
                var farmTerm = resolvedFarmFilter.ToLower();
                labourQuery = labourQuery.Where(l => l.FarmName.ToLower().Contains(farmTerm));
            }
            labourAttendances = await labourQuery.ToListAsync(cancellationToken);
        }

        List<CropActivity> cropActivities = new();
        if (parameters.IncludeCropActivities)
        {
            var actQuery = _farmDb.CropActivities.AsNoTracking().AsQueryable();
            if (fromDate.HasValue) actQuery = actQuery.Where(a => a.ActivityDate >= fromDate.Value);
            if (toDate.HasValue) actQuery = actQuery.Where(a => a.ActivityDate <= toDate.Value);
            if (resolvedFarmFilter != null)
            {
                var farmTerm = resolvedFarmFilter.ToLower();
                actQuery = actQuery.Where(a => a.Farm.ToLower().Contains(farmTerm));
            }
            if (parameters.SeasonId.HasValue)
            {
                actQuery = actQuery.Where(a => a.SeasonId == parameters.SeasonId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(parameters.Season))
            {
                var seasonTerm = parameters.Season.Trim().ToLower();
                actQuery = actQuery.Where(a => a.Season.ToLower().Contains(seasonTerm));
            }
            cropActivities = await actQuery.ToListAsync(cancellationToken);
        }

        // Sequential queries on SalesDbContext
        var salesQuery = _salesDb.Sales.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) salesQuery = salesQuery.Where(s => s.SalesDate >= fromDate.Value);
        if (toDate.HasValue) salesQuery = salesQuery.Where(s => s.SalesDate <= toDate.Value);
        if (resolvedFarmFilter != null)
        {
            var farmTerm = resolvedFarmFilter.ToLower();
            salesQuery = salesQuery.Where(s => s.Farm.ToLower().Contains(farmTerm));
        }
        var sales = await salesQuery.ToListAsync(cancellationToken);

        var saleIds = sales.Select(s => s.Id).ToList();
        var saleNos = sales.Select(s => s.SalesNo.ToLower()).Distinct().ToList();
        var salesItems = sales.Count > 0
            ? await _salesDb.SalesItems
                .AsNoTracking()
                .Where(i => (i.SaleId.HasValue && saleIds.Contains(i.SaleId.Value)) || saleNos.Contains(i.SalesNo.ToLower()))
                .ToListAsync(cancellationToken)
            : new List<SalesItem>();

        // Query on ExpenseDbContext
        var expenseQuery = _expenseDb.ExpenseTransactions.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) expenseQuery = expenseQuery.Where(e => e.ExpenseDate >= fromDate.Value);
        if (toDate.HasValue) expenseQuery = expenseQuery.Where(e => e.ExpenseDate <= toDate.Value);
        if (resolvedFarmFilter != null)
        {
            var farmTerm = resolvedFarmFilter.ToLower();
            expenseQuery = expenseQuery.Where(e => e.Farm.ToLower().Contains(farmTerm));
        }
        var expenses = await expenseQuery.ToListAsync(cancellationToken);

        // Build canonical crop resolver
        var resolver = new CropBucketRegistry(masterCrops);

        // 1. Seed master crops if requested (only when no farm/season/date/crop filter hides empty master crops, or filter will run after)
        foreach (var mc in masterCrops)
        {
            resolver.GetOrCreateByMaster(mc);
        }

        // 2. Accumulate Area & Seasons from CropSeasons
        foreach (var season in seasons)
        {
            if (string.Equals(season.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var bucket = resolver.GetOrCreate(season.CropId, season.Crop?.CropName);
            if (bucket == null) continue;

            bucket.AreaAcres += Math.Max(0m, season.AreaAcres);
            if (!string.IsNullOrWhiteSpace(season.SeasonName))
            {
                bucket.Seasons.Add(season.SeasonName.Trim());
            }
            if (!string.IsNullOrWhiteSpace(season.Farm?.FarmName))
            {
                bucket.Farms.Add(season.Farm.FarmName.Trim());
            }
        }

        // 3. Accumulate Sales (handling single-crop and multi-crop SalesItems safely)
        var itemsBySaleId = salesItems
            .Where(i => i.SaleId.HasValue)
            .GroupBy(i => i.SaleId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());
        var itemsBySaleNo = salesItems
            .GroupBy(i => i.SalesNo.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var sale in sales)
        {
            var matchedItems = itemsBySaleId.TryGetValue(sale.Id, out var byIdList) && byIdList.Count > 0
                ? byIdList
                : (itemsBySaleNo.TryGetValue(sale.SalesNo.ToLowerInvariant(), out var byNoList)
                    ? byNoList
                    : new List<SalesItem>());

            var distinctItemCrops = matchedItems
                .Select(i => resolver.ResolveCanonicalKey(null, i.Crop))
                .Where(k => !string.IsNullOrEmpty(k))
                .Distinct()
                .ToList();

            if (matchedItems.Count == 0 || distinctItemCrops.Count <= 1)
            {
                var targetCropName = !string.IsNullOrWhiteSpace(sale.Crop)
                    ? sale.Crop
                    : matchedItems.FirstOrDefault()?.Crop;
                var bucket = resolver.GetOrCreate(null, targetCropName);
                if (bucket == null) continue;

                bucket.CropSales += sale.NetAmount;
                bucket.GrossCropSales += sale.GrossAmount;
                bucket.SalesDeductions += sale.Commission + sale.Transport;
                bucket.AddIncomeBucket("Crop Sales", sale.NetAmount);
                bucket.SalesCount++;
                if (!string.IsNullOrWhiteSpace(sale.Farm)) bucket.Farms.Add(sale.Farm.Trim());

                if (matchedItems.Count > 0)
                {
                    foreach (var item in matchedItems)
                    {
                        bucket.AddQuantity(item.Quantity, item.Unit);
                    }
                }
                else
                {
                    bucket.AddQuantity(sale.Quantity, sale.Unit);
                }
            }
            else
            {
                var totalItemAmount = matchedItems.Sum(i => i.Amount);
                var saleDeductions = sale.Commission + sale.Transport;

                foreach (var item in matchedItems)
                {
                    var bucket = resolver.GetOrCreate(null, item.Crop);
                    if (bucket == null) continue;

                    var ratio = totalItemAmount > 0m
                        ? item.Amount / totalItemAmount
                        : 1m / matchedItems.Count;

                    var allocatedNet = Math.Round(sale.NetAmount * ratio, 2);
                    var allocatedDeduction = Math.Round(saleDeductions * ratio, 2);

                    bucket.CropSales += allocatedNet;
                    bucket.GrossCropSales += item.Amount;
                    bucket.SalesDeductions += allocatedDeduction;
                    bucket.AddIncomeBucket("Crop Sales", allocatedNet);
                    bucket.SalesCount++;
                    if (!string.IsNullOrWhiteSpace(sale.Farm)) bucket.Farms.Add(sale.Farm.Trim());
                    bucket.AddQuantity(item.Quantity, item.Unit);
                }
            }
        }

        // 4. Accumulate IncomeTransactions
        foreach (var tx in incomeTransactions)
        {
            if (string.IsNullOrWhiteSpace(tx.Crop)) continue;
            var bucket = resolver.GetOrCreate(null, tx.Crop);
            if (bucket == null) continue;

            var categoryName = string.IsNullOrWhiteSpace(tx.Category?.Name)
                ? "Other Income"
                : tx.Category.Name.Trim();

            if (categoryName.Equals("Crop Sales", StringComparison.OrdinalIgnoreCase))
            {
                bucket.CropSales += tx.NetAmount;
                bucket.GrossCropSales += tx.GrossAmount;
                bucket.AddIncomeBucket("Crop Sales", tx.NetAmount);

                foreach (var item in tx.Items)
                {
                    bucket.AddQuantity(item.Quantity, item.Unit);
                }
            }
            else
            {
                bucket.OtherIncome += tx.NetAmount;
                bucket.AddIncomeBucket(categoryName, tx.NetAmount);
            }

            bucket.IncomeTransactionCount++;
            if (!string.IsNullOrWhiteSpace(tx.Farm)) bucket.Farms.Add(tx.Farm.Trim());
        }

        // 5. Accumulate ExpenseTransactions
        foreach (var exp in expenses)
        {
            if (string.IsNullOrWhiteSpace(exp.Crop)) continue;
            var bucket = resolver.GetOrCreate(null, exp.Crop);
            if (bucket == null) continue;

            var normalizedCat = NormalizeExpenseCategory(exp.ExpenseCategory, exp.Description);
            bucket.AddExpenseBucket(normalizedCat, exp.Amount);
            bucket.ExpenseTransactionCount++;
            if (!string.IsNullOrWhiteSpace(exp.Farm)) bucket.Farms.Add(exp.Farm.Trim());
        }

        // 6. Accumulate LabourAttendances (when enabled)
        foreach (var lab in labourAttendances)
        {
            if (string.IsNullOrWhiteSpace(lab.CropName)) continue;
            var amount = lab.Amount > 0m ? lab.Amount : lab.CalculatedAmount;
            if (amount <= 0m) continue;

            var bucket = resolver.GetOrCreate(null, lab.CropName);
            if (bucket == null) continue;

            bucket.AddExpenseBucket("Labour", amount);
            bucket.LabourAttendanceCount++;
            if (!string.IsNullOrWhiteSpace(lab.FarmName)) bucket.Farms.Add(lab.FarmName.Trim());
        }

        // 7. Accumulate CropActivities (opt-in)
        foreach (var act in cropActivities)
        {
            if (act.TotalCost <= 0m) continue;
            if (!act.CropId.HasValue && string.IsNullOrWhiteSpace(act.Crop)) continue;

            var bucket = resolver.GetOrCreate(act.CropId, act.Crop);
            if (bucket == null) continue;

            var cat = NormalizeActivityCostCategory(act.ActivityType);
            bucket.AddExpenseBucket(cat, act.TotalCost);
            bucket.CropActivityCount++;
            if (!string.IsNullOrWhiteSpace(act.Farm)) bucket.Farms.Add(act.Farm.Trim());
            if (!string.IsNullOrWhiteSpace(act.Season)) bucket.Seasons.Add(act.Season.Trim());
        }

        // Filter buckets by CropId / Crop / Empty preference
        var allBuckets = resolver.Buckets.AsEnumerable();

        if (parameters.CropId.HasValue)
        {
            allBuckets = allBuckets.Where(b => b.CropId == parameters.CropId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(parameters.Crop))
        {
            var requestedRaw = parameters.Crop.Trim();
            var resolvedKey = resolver.ResolveCanonicalKey(null, requestedRaw);
            var requestedLower = requestedRaw.ToLowerInvariant();
            var requestedBase = StripParenthetical(requestedLower);

            allBuckets = allBuckets.Where(b =>
                b.CanonicalKey == resolvedKey ||
                b.CropName.Equals(requestedRaw, StringComparison.OrdinalIgnoreCase) ||
                StripParenthetical(b.CropName.ToLowerInvariant()) == requestedBase);
        }

        if (!parameters.IncludeInactiveOrEmptyCrops && !parameters.CropId.HasValue && string.IsNullOrWhiteSpace(parameters.Crop))
        {
            allBuckets = allBuckets.Where(b => b.HasAnyActivity);
        }

        // When filtering by Farm or Season, exclude master crops that had zero records in that Farm/Season
        if (resolvedFarmFilter != null || parameters.FarmId.HasValue || !string.IsNullOrWhiteSpace(parameters.Season) || parameters.SeasonId.HasValue)
        {
            allBuckets = allBuckets.Where(b => b.HasAnyActivity);
        }

        return allBuckets
            .Select(b => MapToDto(b, parameters.IncludeZeroCategories))
            .OrderByDescending(c => c.TotalIncome > 0m || c.TotalExpenses > 0m)
            .ThenByDescending(c => c.NetProfit)
            .ThenBy(c => c.Crop)
            .ToList();
    }

    private static CropProfitabilityItemDto MapToDto(CropBucket b, bool includeZeroCategories)
    {
        var cropSales = Math.Round(b.CropSales, 2);
        var otherIncome = Math.Round(b.OtherIncome, 2);
        var totalIncome = Math.Round(cropSales + otherIncome, 2);

        var incomeBreakdown = b.IncomeByCategory
            .Where(kv => kv.Value.Amount > 0m)
            .OrderByDescending(kv => kv.Key.Equals("Crop Sales", StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(kv => kv.Value.Amount)
            .Select(kv => CreateLineItem(kv.Key, kv.Value.Amount, kv.Value.Count))
            .ToList();

        var seeds = Math.Round(b.GetExpense("Seeds"), 2);
        var fertilizer = Math.Round(b.GetExpense("Fertilizer"), 2);
        var pesticides = Math.Round(b.GetExpense("Pesticides"), 2);
        var labour = Math.Round(b.GetExpense("Labour"), 2);
        var diesel = Math.Round(b.GetExpense("Diesel"), 2);
        var machinery = Math.Round(b.GetExpense("Machinery"), 2);
        var transport = Math.Round(b.GetExpense("Transport"), 2);

        decimal otherExpenses = 0m;
        var extraExpenseLines = new List<CropFinancialLineItemDto>();
        foreach (var kv in b.ExpensesByCategory.OrderByDescending(x => x.Value.Amount))
        {
            if (CoreExpenseOrder.Contains(kv.Key, StringComparer.OrdinalIgnoreCase))
            {
                continue;
            }
            var amt = Math.Round(kv.Value.Amount, 2);
            if (amt > 0m)
            {
                otherExpenses += amt;
                extraExpenseLines.Add(CreateLineItem(kv.Key, amt, kv.Value.Count));
            }
        }
        otherExpenses = Math.Round(otherExpenses, 2);

        var expenseBreakdown = new List<CropFinancialLineItemDto>();
        foreach (var coreCat in CoreExpenseOrder)
        {
            var entry = b.ExpensesByCategory.GetValueOrDefault(coreCat);
            var amt = Math.Round(entry.Amount, 2);
            if (includeZeroCategories || amt > 0m)
            {
                expenseBreakdown.Add(CreateLineItem(coreCat, amt, entry.Count));
            }
        }
        expenseBreakdown.AddRange(extraExpenseLines);

        var totalExpenses = Math.Round(
            seeds + fertilizer + pesticides + labour + diesel + machinery + transport + otherExpenses,
            2);

        var netProfit = Math.Round(totalIncome - totalExpenses, 2);
        var area = Math.Round(b.AreaAcres, 2);
        var soldKg = Math.Round(b.SoldQuantityKg, 2);

        var primaryUnitEntry = b.RawQuantitiesByUnit
            .OrderByDescending(u => u.Value)
            .FirstOrDefault();

        return new CropProfitabilityItemDto
        {
            CropId = b.CropId,
            Crop = b.CropName,
            CropCode = b.CropCode,
            CropType = b.CropType,
            AreaAcres = area,
            AreaDisplay = FormatArea(area),
            CropSales = cropSales,
            GrossCropSales = Math.Round(b.GrossCropSales, 2),
            SalesDeductions = Math.Round(b.SalesDeductions, 2),
            OtherIncome = otherIncome,
            TotalIncome = totalIncome,
            IncomeBreakdown = incomeBreakdown,
            ExpensesByCategory = new CropExpenseCategorySummaryDto
            {
                Seeds = seeds,
                Fertilizer = fertilizer,
                Pesticides = pesticides,
                Labour = labour,
                Diesel = diesel,
                Machinery = machinery,
                Transport = transport,
                Other = otherExpenses
            },
            ExpenseBreakdown = expenseBreakdown,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            NetProfitFormula = "Total Income - Total Expenses",
            ProfitStatus = DetermineProfitStatus(netProfit),
            SoldQuantityKg = soldKg,
            PrimarySoldQuantity = Math.Round(primaryUnitEntry.Value, 2),
            PrimarySoldUnit = string.IsNullOrWhiteSpace(primaryUnitEntry.Key) ? null : primaryUnitEntry.Key,
            Metrics = ComputeMetrics(area, soldKg, cropSales, totalIncome, totalExpenses, netProfit),
            FormattedCropSales = FormatInr(cropSales),
            FormattedTotalIncome = FormatInr(totalIncome),
            FormattedTotalExpenses = FormatInr(totalExpenses),
            FormattedNetProfit = FormatInr(netProfit),
            Farms = b.Farms.OrderBy(f => f).ToList(),
            Seasons = b.Seasons.OrderBy(s => s).ToList(),
            SalesCount = b.SalesCount,
            IncomeTransactionCount = b.IncomeTransactionCount,
            ExpenseTransactionCount = b.ExpenseTransactionCount,
            LabourAttendanceCount = b.LabourAttendanceCount,
            CropActivityCount = b.CropActivityCount
        };
    }

    private static CropProfitabilityItemDto ApplyOptionalOverrides(
        CropProfitabilityItemDto item,
        CropProfitabilityQueryParameters parameters)
    {
        var effectiveArea = parameters.AreaAcres.HasValue && parameters.AreaAcres.Value > 0m
            ? Math.Round(parameters.AreaAcres.Value, 2)
            : item.AreaAcres;

        var effectiveKg = parameters.TotalQuantityKg.HasValue && parameters.TotalQuantityKg.Value > 0m
            ? Math.Round(parameters.TotalQuantityKg.Value, 2)
            : item.SoldQuantityKg;

        if (effectiveArea == item.AreaAcres && effectiveKg == item.SoldQuantityKg)
        {
            return item;
        }

        item.AreaAcres = effectiveArea;
        item.AreaDisplay = FormatArea(effectiveArea);
        item.SoldQuantityKg = effectiveKg;
        item.Metrics = ComputeMetrics(
            effectiveArea,
            effectiveKg,
            item.CropSales,
            item.TotalIncome,
            item.TotalExpenses,
            item.NetProfit);

        return item;
    }

    private static CropProfitabilitySummaryTotalsDto BuildSummaryTotals(List<CropProfitabilityItemDto> items)
    {
        var totalArea = Math.Round(items.Sum(c => c.AreaAcres), 2);
        var totalCropSales = Math.Round(items.Sum(c => c.CropSales), 2);
        var totalOtherIncome = Math.Round(items.Sum(c => c.OtherIncome), 2);
        var totalIncome = Math.Round(items.Sum(c => c.TotalIncome), 2);
        var totalExpenses = Math.Round(items.Sum(c => c.TotalExpenses), 2);
        var totalNetProfit = Math.Round(totalIncome - totalExpenses, 2);
        var totalKg = Math.Round(items.Sum(c => c.SoldQuantityKg), 2);

        return new CropProfitabilitySummaryTotalsDto
        {
            TotalCrops = items.Count,
            ProfitableCrops = items.Count(c => c.NetProfit > 0m),
            LossMakingCrops = items.Count(c => c.NetProfit < 0m),
            TotalAreaAcres = totalArea,
            TotalCropSales = totalCropSales,
            TotalOtherIncome = totalOtherIncome,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            TotalNetProfit = totalNetProfit,
            TotalSoldQuantityKg = totalKg,
            TotalExpensesByCategory = new CropExpenseCategorySummaryDto
            {
                Seeds = Math.Round(items.Sum(c => c.ExpensesByCategory.Seeds), 2),
                Fertilizer = Math.Round(items.Sum(c => c.ExpensesByCategory.Fertilizer), 2),
                Pesticides = Math.Round(items.Sum(c => c.ExpensesByCategory.Pesticides), 2),
                Labour = Math.Round(items.Sum(c => c.ExpensesByCategory.Labour), 2),
                Diesel = Math.Round(items.Sum(c => c.ExpensesByCategory.Diesel), 2),
                Machinery = Math.Round(items.Sum(c => c.ExpensesByCategory.Machinery), 2),
                Transport = Math.Round(items.Sum(c => c.ExpensesByCategory.Transport), 2),
                Other = Math.Round(items.Sum(c => c.ExpensesByCategory.Other), 2)
            },
            OverallMetrics = ComputeMetrics(totalArea, totalKg, totalCropSales, totalIncome, totalExpenses, totalNetProfit),
            FormattedTotalIncome = FormatInr(totalIncome),
            FormattedTotalExpenses = FormatInr(totalExpenses),
            FormattedTotalNetProfit = FormatInr(totalNetProfit)
        };
    }

    public static CropProfitabilityMetricsDto ComputeMetrics(
        decimal areaAcres,
        decimal quantityKg,
        decimal cropSales,
        decimal totalIncome,
        decimal totalExpenses,
        decimal netProfit)
    {
        var costPerAcre = areaAcres > 0m ? Math.Round(totalExpenses / areaAcres, 2) : 0m;
        var incomePerAcre = areaAcres > 0m ? Math.Round(totalIncome / areaAcres, 2) : 0m;
        var profitPerAcre = areaAcres > 0m ? Math.Round(netProfit / areaAcres, 2) : 0m;

        var costPerKg = quantityKg > 0m ? Math.Round(totalExpenses / quantityKg, 2) : 0m;
        var sellingBase = cropSales > 0m ? cropSales : totalIncome;
        var sellingPricePerKg = quantityKg > 0m ? Math.Round(sellingBase / quantityKg, 2) : 0m;

        var roiPercent = totalExpenses > 0m ? Math.Round((netProfit / totalExpenses) * 100m, 2) : 0m;
        var profitMarginPercent = totalIncome > 0m ? Math.Round((netProfit / totalIncome) * 100m, 2) : 0m;

        return new CropProfitabilityMetricsDto
        {
            CostPerAcre = costPerAcre,
            IncomePerAcre = incomePerAcre,
            ProfitPerAcre = profitPerAcre,
            CostPerKg = costPerKg,
            SellingPricePerKg = sellingPricePerKg,
            RoiPercent = roiPercent,
            ProfitMarginPercent = profitMarginPercent
        };
    }

    public static string NormalizeExpenseCategory(string? rawCategory, string? description)
    {
        var cat = (rawCategory ?? string.Empty).Trim();
        var lower = cat.ToLowerInvariant();
        var descLower = (description ?? string.Empty).Trim().ToLowerInvariant();

        if (lower.Contains("seed") || lower.Contains("sapling") || lower.Contains("nursery"))
            return "Seeds";

        if (lower.Contains("fertilizer") || lower.Contains("fertiliser") || lower.Contains("urea") ||
            lower.Contains("dap") || lower.Contains("potash") || lower.Contains("manure") ||
            lower.Contains("compost") || lower.Contains("nutrient"))
            return "Fertilizer";

        if (lower.Contains("pesticide") || lower.Contains("insecticide") || lower.Contains("fungicide") ||
            lower.Contains("herbicide") || lower.Contains("weedicide") || lower.Contains("crop protection") ||
            lower.Contains("chemical"))
            return "Pesticides";

        if (lower.Contains("labour") || lower.Contains("labor") || lower.Contains("wage"))
            return "Labour";

        if (lower.Contains("diesel") || lower.Contains("fuel") || lower.Contains("petrol"))
            return "Diesel";

        if (lower.Contains("machinery") || lower.Contains("machine") || lower.Contains("tractor") ||
            lower.Contains("equipment") || lower.Contains("harvester") || lower.Contains("rotavator"))
            return "Machinery";

        if (lower.Contains("transport") || lower.Contains("freight") || lower.Contains("haulage") ||
            lower.Contains("cartage") || lower.Contains("logistics"))
            return "Transport";

        if (string.IsNullOrEmpty(lower) || lower.Contains("misc") || lower == "other")
        {
            if (descLower.Contains("transport") || descLower.Contains("freight") || descLower.Contains("haulage"))
                return "Transport";
            if (descLower.Contains("diesel") || descLower.Contains("fuel"))
                return "Diesel";
            if (descLower.Contains("seed"))
                return "Seeds";
            if (descLower.Contains("fertilizer") || descLower.Contains("urea") || descLower.Contains("dap"))
                return "Fertilizer";
            if (descLower.Contains("pesticide") || descLower.Contains("spray"))
                return "Pesticides";
            if (descLower.Contains("labour") || descLower.Contains("labor") || descLower.Contains("weeding"))
                return "Labour";
            if (descLower.Contains("tractor") || descLower.Contains("machinery") || descLower.Contains("harvester"))
                return "Machinery";

            return string.IsNullOrEmpty(cat) ? "Other" : cat;
        }

        return cat;
    }

    private static string NormalizeActivityCostCategory(string? activityType)
    {
        var lower = (activityType ?? string.Empty).Trim().ToLowerInvariant();
        if (lower.Contains("sow") || lower.Contains("seed") || lower.Contains("plant"))
            return "Seeds";
        if (lower.Contains("fertil") || lower.Contains("manure") || lower.Contains("nutrient"))
            return "Fertilizer";
        if (lower.Contains("pest") || lower.Contains("spray"))
            return "Pesticides";
        if (lower.Contains("harvest") || lower.Contains("plough") || lower.Contains("land"))
            return "Machinery";
        if (lower.Contains("weed") || lower.Contains("labour") || lower.Contains("transplant"))
            return "Labour";
        return "Other";
    }

    public static decimal ConvertToKg(decimal quantity, string? unit)
    {
        if (quantity <= 0m || string.IsNullOrWhiteSpace(unit))
            return 0m;

        var u = unit.Trim().ToLowerInvariant();
        return u switch
        {
            "kg" or "kgs" or "kilogram" or "kilograms" => quantity,
            "g" or "gm" or "gms" or "gram" or "grams" => quantity / 1000m,
            "qtl" or "qtls" or "quintal" or "quintals" => quantity * 100m,
            "ton" or "tons" or "tonne" or "tonnes" or "mt" or "metric ton" or "metric tons" => quantity * 1000m,
            _ => 0m
        };
    }

    private static string StripParenthetical(string text)
    {
        return ParentheticalRegex.Replace(text, " ").Trim();
    }

    private static string DetermineProfitStatus(decimal netProfit)
    {
        if (netProfit > 0m) return "Profit";
        if (netProfit < 0m) return "Loss";
        return "Break-even";
    }

    private static string FormatArea(decimal areaAcres)
    {
        return areaAcres % 1m == 0m
            ? $"{areaAcres:0} Acres"
            : $"{areaAcres:0.##} Acres";
    }

    private static string FormatInr(decimal amount)
    {
        var isNeg = amount < 0m;
        var abs = Math.Abs(amount);
        var formatted = abs % 1m == 0m
            ? string.Format(IndianCulture, "₹{0:N0}", abs)
            : string.Format(IndianCulture, "₹{0:N2}", abs);
        return isNeg ? $"-{formatted}" : formatted;
    }

    private static CropFinancialLineItemDto CreateLineItem(string category, decimal amount, int recordCount)
    {
        var rounded = Math.Round(amount, 2);
        return new CropFinancialLineItemDto
        {
            Category = category,
            Amount = rounded,
            FormattedAmount = FormatInr(rounded),
            RecordCount = recordCount
        };
    }

    private static string CsvQuote(string? value)
    {
        var safe = (value ?? string.Empty).Replace("\"", "\"\"");
        return $"\"{safe}\"";
    }

    private sealed class CropBucket
    {
        public string CanonicalKey { get; init; } = string.Empty;
        public int? CropId { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string? CropCode { get; set; }
        public string? CropType { get; set; }
        public decimal AreaAcres { get; set; }

        public decimal CropSales { get; set; }
        public decimal GrossCropSales { get; set; }
        public decimal SalesDeductions { get; set; }
        public decimal OtherIncome { get; set; }
        public decimal SoldQuantityKg { get; set; }

        public int SalesCount { get; set; }
        public int IncomeTransactionCount { get; set; }
        public int ExpenseTransactionCount { get; set; }
        public int LabourAttendanceCount { get; set; }
        public int CropActivityCount { get; set; }

        public HashSet<string> Farms { get; } = new(StringComparer.OrdinalIgnoreCase);
        public HashSet<string> Seasons { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, decimal> RawQuantitiesByUnit { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, (decimal Amount, int Count)> IncomeByCategory { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, (decimal Amount, int Count)> ExpensesByCategory { get; } = new(StringComparer.OrdinalIgnoreCase);

        public bool HasAnyActivity =>
            AreaAcres > 0m ||
            CropSales > 0m ||
            OtherIncome > 0m ||
            ExpensesByCategory.Values.Any(v => v.Amount > 0m) ||
            SalesCount > 0 ||
            IncomeTransactionCount > 0 ||
            ExpenseTransactionCount > 0 ||
            LabourAttendanceCount > 0 ||
            CropActivityCount > 0;

        public void AddIncomeBucket(string category, decimal amount)
        {
            var current = IncomeByCategory.GetValueOrDefault(category);
            IncomeByCategory[category] = (current.Amount + amount, current.Count + 1);
        }

        public void AddExpenseBucket(string category, decimal amount)
        {
            var current = ExpensesByCategory.GetValueOrDefault(category);
            ExpensesByCategory[category] = (current.Amount + amount, current.Count + 1);
        }

        public decimal GetExpense(string category) =>
            ExpensesByCategory.GetValueOrDefault(category).Amount;

        public void AddQuantity(decimal quantity, string? unit)
        {
            if (quantity <= 0m) return;
            SoldQuantityKg += ConvertToKg(quantity, unit);
            var cleanUnit = string.IsNullOrWhiteSpace(unit) ? "Units" : unit.Trim();
            RawQuantitiesByUnit[cleanUnit] = RawQuantitiesByUnit.GetValueOrDefault(cleanUnit) + quantity;
        }
    }

    private sealed class CropBucketRegistry
    {
        private readonly Dictionary<int, CropBucket> _byId = new();
        private readonly Dictionary<string, CropBucket> _byExactLower = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, CropBucket?> _byBaseLower = new(StringComparer.OrdinalIgnoreCase);
        public List<CropBucket> Buckets { get; } = new();

        public CropBucketRegistry(IEnumerable<Crop> masterCrops)
        {
            foreach (var c in masterCrops)
            {
                if (string.IsNullOrWhiteSpace(c.CropName)) continue;
                var bucket = GetOrCreateByMaster(c);
                var baseLower = StripParenthetical(c.CropName.Trim().ToLowerInvariant());
                if (!string.IsNullOrEmpty(baseLower))
                {
                    if (_byBaseLower.ContainsKey(baseLower))
                    {
                        _byBaseLower[baseLower] = null; // Ambiguous, don't auto-alias
                    }
                    else
                    {
                        _byBaseLower[baseLower] = bucket;
                    }
                }
            }
        }

        public CropBucket GetOrCreateByMaster(Crop crop)
        {
            if (_byId.TryGetValue(crop.Id, out var existing))
            {
                return existing;
            }

            var cleanName = crop.CropName.Trim();
            var lower = cleanName.ToLowerInvariant();
            if (_byExactLower.TryGetValue(lower, out var byName))
            {
                byName.CropId ??= crop.Id;
                byName.CropCode ??= crop.CropCode;
                byName.CropType ??= crop.CropType;
                _byId[crop.Id] = byName;
                return byName;
            }

            var bucket = new CropBucket
            {
                CanonicalKey = lower,
                CropId = crop.Id,
                CropName = cleanName,
                CropCode = crop.CropCode,
                CropType = crop.CropType
            };

            _byId[crop.Id] = bucket;
            _byExactLower[lower] = bucket;
            Buckets.Add(bucket);
            return bucket;
        }

        public string ResolveCanonicalKey(int? cropId, string? cropName)
        {
            if (cropId.HasValue && _byId.TryGetValue(cropId.Value, out var idBucket))
            {
                return idBucket.CanonicalKey;
            }

            if (string.IsNullOrWhiteSpace(cropName))
            {
                return string.Empty;
            }

            var lower = cropName.Trim().ToLowerInvariant();
            if (_byExactLower.TryGetValue(lower, out var exact))
            {
                return exact.CanonicalKey;
            }

            var baseLower = StripParenthetical(lower);
            if (!string.IsNullOrEmpty(baseLower) && _byBaseLower.TryGetValue(baseLower, out var aliased) && aliased != null)
            {
                return aliased.CanonicalKey;
            }

            return lower;
        }

        public CropBucket? GetOrCreate(int? cropId, string? cropName)
        {
            if (cropId.HasValue && _byId.TryGetValue(cropId.Value, out var byId))
            {
                return byId;
            }

            if (string.IsNullOrWhiteSpace(cropName))
            {
                return null;
            }

            var clean = cropName.Trim();
            var lower = clean.ToLowerInvariant();

            if (_byExactLower.TryGetValue(lower, out var exact))
            {
                return exact;
            }

            var baseLower = StripParenthetical(lower);
            if (!string.IsNullOrEmpty(baseLower) && _byBaseLower.TryGetValue(baseLower, out var aliased) && aliased != null)
            {
                return aliased;
            }

            var created = new CropBucket
            {
                CanonicalKey = lower,
                CropId = cropId,
                CropName = clean
            };

            _byExactLower[lower] = created;
            if (cropId.HasValue)
            {
                _byId[cropId.Value] = created;
            }
            Buckets.Add(created);
            return created;
        }
    }
}
