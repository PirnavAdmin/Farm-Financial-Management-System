using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;
using SalesApi.DTOs;
using SalesApi.Models;

namespace SalesApi.Services;

public class SalesService : ISalesService
{
    private readonly SalesDbContext _context;
    private readonly ILogger<SalesService> _logger;

    private static readonly HashSet<string> AllowedPaymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Pending", "Partially Paid", "Part Paid", "Paid", "Completed"
    };

    private static readonly HashSet<string> AllowedBuyerStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Active", "Inactive"
    };

    public SalesService(SalesDbContext context, ILogger<SalesService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    public static string NormalizePaymentStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "Pending";
        var s = status.Trim();
        if (s.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Paid", StringComparison.OrdinalIgnoreCase))
            return "Paid";
        if (s.Equals("Part Paid", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Partially Paid", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Partial", StringComparison.OrdinalIgnoreCase))
            return "Partially Paid";
        return "Pending";
    }

    public static string ComputePaymentStatus(decimal netAmount, decimal paidAmount)
    {
        if (paidAmount <= 0m) return "Pending";
        if (paidAmount >= netAmount - 0.01m) return "Paid";
        return "Partially Paid";
    }

    private static decimal ComputeEffectivePaidAmount(Sale sale, decimal recordedPaymentsSum)
    {
        if (NormalizePaymentStatus(sale.PaymentStatus) == "Paid" && recordedPaymentsSum <= 0m)
        {
            return sale.NetAmount;
        }
        return Math.Min(sale.NetAmount, Math.Max(0m, recordedPaymentsSum));
    }

    private async Task<int?> ResolveBuyerIdAsync(int? buyerId, string? buyerName)
    {
        if (buyerId.HasValue)
        {
            var exists = await _context.Buyers.AnyAsync(b => b.Id == buyerId.Value);
            if (exists) return buyerId.Value;
        }

        if (!string.IsNullOrWhiteSpace(buyerName))
        {
            var normalized = buyerName.Trim().ToLower();
            var matched = await _context.Buyers
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.BuyerName.ToLower() == normalized);
            if (matched != null) return matched.Id;
        }

        return null;
    }

    private async Task<string> GenerateUniqueSalesNoAsync(DateTime salesDate)
    {
        var year = salesDate.Year > 2000 ? salesDate.Year : DateTime.UtcNow.Year;
        var prefix = $"SAL-{year}-";
        var existingNos = await _context.Sales
            .AsNoTracking()
            .Where(s => s.SalesNo.StartsWith(prefix))
            .Select(s => s.SalesNo)
            .ToListAsync();

        var maxSeq = 0;
        foreach (var no in existingNos)
        {
            if (int.TryParse(no.Substring(prefix.Length), out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        var candidate = $"{prefix}{maxSeq + 1:D3}";
        while (await _context.Sales.AnyAsync(s => s.SalesNo == candidate))
        {
            maxSeq++;
            candidate = $"{prefix}{maxSeq + 1:D3}";
        }
        return candidate;
    }

    private async Task<string> GenerateUniquePaymentNoAsync(DateTime paymentDate)
    {
        var year = paymentDate.Year > 2000 ? paymentDate.Year : DateTime.UtcNow.Year;
        var prefix = $"SPAY-{year}-";
        var existingNos = await _context.SalesPayments
            .AsNoTracking()
            .Where(p => p.PaymentNo.StartsWith(prefix))
            .Select(p => p.PaymentNo)
            .ToListAsync();

        var maxSeq = 0;
        foreach (var no in existingNos)
        {
            if (int.TryParse(no.Substring(prefix.Length), out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        var candidate = $"{prefix}{maxSeq + 1:D3}";
        while (await _context.SalesPayments.AnyAsync(p => p.PaymentNo == candidate))
        {
            maxSeq++;
            candidate = $"{prefix}{maxSeq + 1:D3}";
        }
        return candidate;
    }

    private async Task<string> GenerateUniqueBuyerCodeAsync()
    {
        const string prefix = "BUY-";
        var existingCodes = await _context.Buyers
            .AsNoTracking()
            .Where(b => b.BuyerCode.StartsWith(prefix))
            .Select(b => b.BuyerCode)
            .ToListAsync();

        var maxSeq = 0;
        foreach (var code in existingCodes)
        {
            if (int.TryParse(code.Substring(prefix.Length), out var seq) && seq > maxSeq)
            {
                maxSeq = seq;
            }
        }

        var candidate = $"{prefix}{maxSeq + 1:D3}";
        while (await _context.Buyers.AnyAsync(b => b.BuyerCode == candidate))
        {
            maxSeq++;
            candidate = $"{prefix}{maxSeq + 1:D3}";
        }
        return candidate;
    }

    private async Task<decimal> GetRecordedPaidForSaleAsync(Sale sale)
    {
        var salesNoLower = sale.SalesNo.ToLower();
        return await _context.SalesPayments
            .Where(p => p.SaleId == sale.Id || p.SalesNo.ToLower() == salesNoLower)
            .SumAsync(p => (decimal?)p.PaymentAmount) ?? 0m;
    }

    private async Task RecalculateSalePaymentStatusAsync(Sale sale)
    {
        var totalPaid = await GetRecordedPaidForSaleAsync(sale);
        sale.PaymentStatus = ComputePaymentStatus(sale.NetAmount, totalPaid);
        sale.UpdatedAt = DateTime.UtcNow;
    }

    private static SalesItemDto MapItem(SalesItem item) => new()
    {
        Id = item.Id,
        SaleId = item.SaleId,
        SalesNo = item.SalesNo,
        Crop = item.Crop,
        Quantity = item.Quantity,
        Unit = item.Unit,
        Rate = item.Rate,
        Amount = item.Amount,
        CreatedAt = item.CreatedAt
    };

    private static SalesPaymentResponseDto MapPayment(SalesPayment p, string? updatedSaleStatus = null, decimal? remainingBalance = null) => new()
    {
        Id = p.Id,
        SaleId = p.SaleId,
        BuyerId = p.BuyerId,
        PaymentNo = p.PaymentNo,
        PaymentDate = p.PaymentDate,
        Buyer = p.Buyer,
        SalesNo = p.SalesNo,
        PaymentAmount = p.PaymentAmount,
        PaymentMode = p.PaymentMode,
        ReferenceNo = p.ReferenceNo,
        Remarks = p.Remarks,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        UpdatedSaleStatus = updatedSaleStatus,
        RemainingSaleBalance = remainingBalance
    };

    private static SaleResponseDto MapSale(
        Sale s,
        List<SalesItem> items,
        List<SalesPayment> payments)
    {
        var recordedPaid = payments.Sum(p => p.PaymentAmount);
        var effectivePaid = ComputeEffectivePaidAmount(s, recordedPaid);
        var balance = Math.Max(0m, Math.Round(s.NetAmount - effectivePaid, 2));

        return new SaleResponseDto
        {
            Id = s.Id,
            SalesNo = s.SalesNo,
            SalesDate = s.SalesDate,
            BuyerId = s.BuyerId,
            Buyer = s.Buyer,
            Farm = s.Farm,
            Crop = s.Crop,
            Quantity = s.Quantity,
            Unit = s.Unit,
            Rate = s.Rate,
            GrossAmount = s.GrossAmount,
            Commission = s.Commission,
            Transport = s.Transport,
            NetAmount = s.NetAmount,
            PaymentStatus = NormalizePaymentStatus(s.PaymentStatus),
            Remarks = s.Remarks,
            PaidAmount = effectivePaid,
            BalanceAmount = balance,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
            Items = items.Select(MapItem).ToList(),
            Payments = payments.Select(p => MapPayment(p)).ToList()
        };
    }

    private async Task<(Dictionary<int, List<SalesItem>> ItemsBySaleId, Dictionary<string, List<SalesItem>> ItemsByNo,
        Dictionary<int, List<SalesPayment>> PaymentsBySaleId, Dictionary<string, List<SalesPayment>> PaymentsByNo)>
        LoadRelatedForSalesAsync(List<Sale> sales)
    {
        var saleIds = sales.Select(s => s.Id).ToList();
        var saleNos = sales.Select(s => s.SalesNo.ToLower()).Distinct().ToList();

        var items = await _context.SalesItems
            .AsNoTracking()
            .Where(i => (i.SaleId.HasValue && saleIds.Contains(i.SaleId.Value)) || saleNos.Contains(i.SalesNo.ToLower()))
            .OrderBy(i => i.Id)
            .ToListAsync();

        var payments = await _context.SalesPayments
            .AsNoTracking()
            .Where(p => (p.SaleId.HasValue && saleIds.Contains(p.SaleId.Value)) || saleNos.Contains(p.SalesNo.ToLower()))
            .OrderByDescending(p => p.PaymentDate)
            .ThenByDescending(p => p.Id)
            .ToListAsync();

        return (
            items.Where(i => i.SaleId.HasValue).GroupBy(i => i.SaleId!.Value).ToDictionary(g => g.Key, g => g.ToList()),
            items.GroupBy(i => i.SalesNo.ToLower()).ToDictionary(g => g.Key, g => g.ToList()),
            payments.Where(p => p.SaleId.HasValue).GroupBy(p => p.SaleId!.Value).ToDictionary(g => g.Key, g => g.ToList()),
            payments.GroupBy(p => p.SalesNo.ToLower()).ToDictionary(g => g.Key, g => g.ToList())
        );
    }

    private static List<SalesItem> MatchItems(Sale sale, Dictionary<int, List<SalesItem>> byId, Dictionary<string, List<SalesItem>> byNo)
    {
        if (byId.TryGetValue(sale.Id, out var list) && list.Count > 0) return list;
        if (byNo.TryGetValue(sale.SalesNo.ToLower(), out var byNoList)) return byNoList;
        return new List<SalesItem>();
    }

    private static List<SalesPayment> MatchPayments(Sale sale, Dictionary<int, List<SalesPayment>> byId, Dictionary<string, List<SalesPayment>> byNo)
    {
        var result = new Dictionary<int, SalesPayment>();
        if (byId.TryGetValue(sale.Id, out var list))
            foreach (var p in list) result[p.Id] = p;
        if (byNo.TryGetValue(sale.SalesNo.ToLower(), out var byNoList))
            foreach (var p in byNoList) result[p.Id] = p;
        return result.Values.OrderByDescending(p => p.PaymentDate).ThenByDescending(p => p.Id).ToList();
    }

    // -------------------------------------------------------------------------
    // 1. SALES OPERATIONS
    // -------------------------------------------------------------------------
    public async Task<PagedResult<SaleResponseDto>> GetSalesAsync(SaleQueryParameters query)
    {
        var salesQuery = ApplySalesFilters(_context.Sales.AsNoTracking().AsQueryable(), query);

        var totalCount = await salesQuery.CountAsync();

        salesQuery = query.SortBy?.ToLower() switch
        {
            "dateasc" => salesQuery.OrderBy(s => s.SalesDate).ThenBy(s => s.Id),
            "amountdesc" => salesQuery.OrderByDescending(s => s.NetAmount).ThenByDescending(s => s.Id),
            "amountasc" => salesQuery.OrderBy(s => s.NetAmount).ThenBy(s => s.Id),
            _ => salesQuery.OrderByDescending(s => s.SalesDate).ThenByDescending(s => s.Id)
        };

        var page = query.Page > 0 ? query.Page : 1;
        var pageSize = query.PageSize > 0 ? Math.Min(query.PageSize, 500) : 10;

        var pageSales = await salesQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var (itemsById, itemsByNo, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(pageSales);

        var dtoItems = pageSales
            .Select(s => MapSale(s, MatchItems(s, itemsById, itemsByNo), MatchPayments(s, paymentsById, paymentsByNo)))
            .ToList();

        return new PagedResult<SaleResponseDto>
        {
            Items = dtoItems,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static IQueryable<Sale> ApplySalesFilters(IQueryable<Sale> salesQuery, SaleQueryParameters query)
    {
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            salesQuery = salesQuery.Where(s =>
                s.SalesNo.ToLower().Contains(term) ||
                s.Buyer.ToLower().Contains(term) ||
                s.Farm.ToLower().Contains(term) ||
                s.Crop.ToLower().Contains(term) ||
                (s.Remarks != null && s.Remarks.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var normalized = NormalizePaymentStatus(query.Status).ToLower();
            if (normalized == "partially paid")
            {
                salesQuery = salesQuery.Where(s =>
                    s.PaymentStatus.ToLower() == "partially paid" ||
                    s.PaymentStatus.ToLower() == "part paid" ||
                    s.PaymentStatus.ToLower() == "partial");
            }
            else if (normalized == "paid")
            {
                salesQuery = salesQuery.Where(s =>
                    s.PaymentStatus.ToLower() == "paid" ||
                    s.PaymentStatus.ToLower() == "completed");
            }
            else
            {
                salesQuery = salesQuery.Where(s => s.PaymentStatus.ToLower() == normalized);
            }
        }

        if (!string.IsNullOrWhiteSpace(query.Buyer) && !query.Buyer.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var buyerTerm = query.Buyer.Trim().ToLower();
            salesQuery = salesQuery.Where(s => s.Buyer.ToLower() == buyerTerm);
        }

        if (!string.IsNullOrWhiteSpace(query.Crop) && !query.Crop.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cropTerm = query.Crop.Trim().ToLower();
            salesQuery = salesQuery.Where(s => s.Crop.ToLower() == cropTerm);
        }

        if (!string.IsNullOrWhiteSpace(query.Farm) && !query.Farm.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var farmTerm = query.Farm.Trim().ToLower();
            salesQuery = salesQuery.Where(s => s.Farm.ToLower() == farmTerm);
        }

        if (query.FromDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate >= query.FromDate.Value.Date);
        }

        if (query.ToDate.HasValue)
        {
            var endOfDay = query.ToDate.Value.Date.AddDays(1).AddTicks(-1);
            salesQuery = salesQuery.Where(s => s.SalesDate <= endOfDay);
        }

        return salesQuery;
    }

    public async Task<SaleResponseDto?> GetSaleByIdAsync(int id)
    {
        var sale = await _context.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null) return null;

        var (itemsById, itemsByNo, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(new List<Sale> { sale });
        return MapSale(sale, MatchItems(sale, itemsById, itemsByNo), MatchPayments(sale, paymentsById, paymentsByNo));
    }

    public async Task<SaleResponseDto?> GetSaleByNoAsync(string salesNo)
    {
        var normalized = salesNo.Trim().ToLower();
        var sale = await _context.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.SalesNo.ToLower() == normalized);
        if (sale == null) return null;

        var (itemsById, itemsByNo, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(new List<Sale> { sale });
        return MapSale(sale, MatchItems(sale, itemsById, itemsByNo), MatchPayments(sale, paymentsById, paymentsByNo));
    }

    public async Task<SaleSummaryDto> GetSalesSummaryAsync()
    {
        var sales = await _context.Sales.AsNoTracking().ToListAsync();
        var (_, _, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(sales);

        decimal totalPaid = 0m;
        decimal totalPending = 0m;
        int pendingCount = 0;
        int partPaidCount = 0;
        int paidCount = 0;

        foreach (var sale in sales)
        {
            var payments = MatchPayments(sale, paymentsById, paymentsByNo);
            var effectivePaid = ComputeEffectivePaidAmount(sale, payments.Sum(p => p.PaymentAmount));
            var balance = Math.Max(0m, Math.Round(sale.NetAmount - effectivePaid, 2));
            var status = NormalizePaymentStatus(sale.PaymentStatus);

            totalPaid += effectivePaid;
            totalPending += balance;

            if (status == "Paid") paidCount++;
            else if (status == "Partially Paid") partPaidCount++;
            else pendingCount++;
        }

        return new SaleSummaryDto
        {
            TotalSalesCount = sales.Count,
            TotalGrossAmount = Math.Round(sales.Sum(s => s.GrossAmount), 2),
            TotalCommission = Math.Round(sales.Sum(s => s.Commission), 2),
            TotalTransport = Math.Round(sales.Sum(s => s.Transport), 2),
            TotalNetAmount = Math.Round(sales.Sum(s => s.NetAmount), 2),
            PendingCount = pendingCount,
            PartPaidCount = partPaidCount,
            PaidCount = paidCount,
            PendingAmount = Math.Round(totalPending, 2),
            PaidAmount = Math.Round(totalPaid, 2)
        };
    }

    public async Task<SalesAnalyticsDto> GetSalesAnalyticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.Sales.AsNoTracking().AsQueryable();
        if (fromDate.HasValue) query = query.Where(s => s.SalesDate >= fromDate.Value.Date);
        if (toDate.HasValue) query = query.Where(s => s.SalesDate <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        var sales = await query.ToListAsync();
        var (_, _, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(sales);

        var enriched = sales.Select(s =>
        {
            var payments = MatchPayments(s, paymentsById, paymentsByNo);
            var received = ComputeEffectivePaidAmount(s, payments.Sum(p => p.PaymentAmount));
            var outstanding = Math.Max(0m, Math.Round(s.NetAmount - received, 2));
            return new { Sale = s, Received = received, Outstanding = outstanding };
        }).ToList();

        List<SalesBreakdownItemDto> GroupByKey(Func<Sale, string> keySelector) =>
            enriched
                .GroupBy(x => keySelector(x.Sale))
                .Select(g => new SalesBreakdownItemDto
                {
                    Key = g.Key,
                    SalesCount = g.Count(),
                    TotalQuantity = Math.Round(g.Sum(x => x.Sale.Quantity), 2),
                    GrossAmount = Math.Round(g.Sum(x => x.Sale.GrossAmount), 2),
                    Commission = Math.Round(g.Sum(x => x.Sale.Commission), 2),
                    Transport = Math.Round(g.Sum(x => x.Sale.Transport), 2),
                    NetAmount = Math.Round(g.Sum(x => x.Sale.NetAmount), 2),
                    AmountReceived = Math.Round(g.Sum(x => x.Received), 2),
                    OutstandingAmount = Math.Round(g.Sum(x => x.Outstanding), 2)
                })
                .OrderByDescending(x => x.NetAmount)
                .ToList();

        var monthly = enriched
            .GroupBy(x => new { x.Sale.SalesDate.Year, x.Sale.SalesDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlySalesTrendDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthLabel = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
                SalesCount = g.Count(),
                GrossAmount = Math.Round(g.Sum(x => x.Sale.GrossAmount), 2),
                NetAmount = Math.Round(g.Sum(x => x.Sale.NetAmount), 2),
                AmountReceived = Math.Round(g.Sum(x => x.Received), 2)
            })
            .ToList();

        var summary = new SaleSummaryDto
        {
            TotalSalesCount = enriched.Count,
            TotalGrossAmount = Math.Round(enriched.Sum(x => x.Sale.GrossAmount), 2),
            TotalCommission = Math.Round(enriched.Sum(x => x.Sale.Commission), 2),
            TotalTransport = Math.Round(enriched.Sum(x => x.Sale.Transport), 2),
            TotalNetAmount = Math.Round(enriched.Sum(x => x.Sale.NetAmount), 2),
            PendingCount = enriched.Count(x => NormalizePaymentStatus(x.Sale.PaymentStatus) == "Pending"),
            PartPaidCount = enriched.Count(x => NormalizePaymentStatus(x.Sale.PaymentStatus) == "Partially Paid"),
            PaidCount = enriched.Count(x => NormalizePaymentStatus(x.Sale.PaymentStatus) == "Paid"),
            PaidAmount = Math.Round(enriched.Sum(x => x.Received), 2),
            PendingAmount = Math.Round(enriched.Sum(x => x.Outstanding), 2)
        };

        return new SalesAnalyticsDto
        {
            Summary = summary,
            ByCrop = GroupByKey(s => s.Crop),
            ByBuyer = GroupByKey(s => s.Buyer),
            ByFarm = GroupByKey(s => s.Farm),
            MonthlyTrend = monthly
        };
    }

    public async Task<ServiceResult<SaleResponseDto>> CreateSaleAsync(CreateSaleDto dto)
    {
        var hasMultiItems = dto.Items != null && dto.Items.Count > 0;
        if (!hasMultiItems)
        {
            if (string.IsNullOrWhiteSpace(dto.Crop))
                return ServiceResult<SaleResponseDto>.Fail("Crop name is required when no line items are provided.");
            if (dto.Quantity <= 0)
                return ServiceResult<SaleResponseDto>.Fail("Quantity must be greater than 0.");
            if (dto.Rate <= 0)
                return ServiceResult<SaleResponseDto>.Fail("Rate must be greater than 0.");
        }

        if (dto.Commission < 0 || dto.Transport < 0)
            return ServiceResult<SaleResponseDto>.Fail("Commission and Transport charges cannot be negative.");

        var salesDate = dto.SalesDate ?? DateTime.UtcNow;
        var salesNo = dto.SalesNo?.Trim();
        if (string.IsNullOrWhiteSpace(salesNo))
        {
            salesNo = await GenerateUniqueSalesNoAsync(salesDate);
        }
        else
        {
            var exists = await _context.Sales.AnyAsync(s => s.SalesNo.ToLower() == salesNo.ToLower());
            if (exists)
                return ServiceResult<SaleResponseDto>.Fail($"Sales record with SalesNo '{salesNo}' already exists.");
        }

        decimal quantity;
        decimal rate;
        decimal grossAmount;
        string primaryCrop;
        string primaryUnit;
        var builtItems = new List<SalesItem>();

        if (hasMultiItems)
        {
            foreach (var itemDto in dto.Items!)
            {
                if (itemDto.Quantity <= 0 || itemDto.Rate <= 0)
                    return ServiceResult<SaleResponseDto>.Fail("Every line item must have Quantity > 0 and Rate > 0.");

                var lineAmount = itemDto.Amount.HasValue && itemDto.Amount.Value > 0
                    ? Math.Round(itemDto.Amount.Value, 2)
                    : Math.Round(itemDto.Quantity * itemDto.Rate, 2);

                builtItems.Add(new SalesItem
                {
                    SalesNo = salesNo,
                    Crop = itemDto.Crop.Trim(),
                    Quantity = itemDto.Quantity,
                    Unit = string.IsNullOrWhiteSpace(itemDto.Unit) ? "kg" : itemDto.Unit.Trim(),
                    Rate = itemDto.Rate,
                    Amount = lineAmount,
                    CreatedAt = DateTime.UtcNow
                });
            }

            grossAmount = Math.Round(builtItems.Sum(i => i.Amount), 2);
            quantity = Math.Round(builtItems.Sum(i => i.Quantity), 2);
            rate = quantity > 0 ? Math.Round(grossAmount / quantity, 2) : 0m;
            primaryCrop = string.IsNullOrWhiteSpace(dto.Crop)
                ? (builtItems.Count == 1 ? builtItems[0].Crop : $"{builtItems[0].Crop} (+{builtItems.Count - 1} more)")
                : dto.Crop.Trim();
            primaryUnit = string.IsNullOrWhiteSpace(dto.Unit) ? builtItems[0].Unit : dto.Unit.Trim();
        }
        else
        {
            quantity = dto.Quantity;
            rate = dto.Rate;
            primaryCrop = dto.Crop.Trim();
            primaryUnit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim();
            grossAmount = dto.GrossAmount.HasValue && dto.GrossAmount.Value > 0
                ? Math.Round(dto.GrossAmount.Value, 2)
                : Math.Round(quantity * rate, 2);

            builtItems.Add(new SalesItem
            {
                SalesNo = salesNo,
                Crop = primaryCrop,
                Quantity = quantity,
                Unit = primaryUnit,
                Rate = rate,
                Amount = grossAmount,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (dto.Commission + dto.Transport > grossAmount)
            return ServiceResult<SaleResponseDto>.Fail("Commission + Transport cannot exceed Gross Amount.");

        var netAmount = dto.NetAmount.HasValue && dto.NetAmount.Value > 0 && !hasMultiItems
            ? Math.Round(dto.NetAmount.Value, 2)
            : Math.Round(grossAmount - dto.Commission - dto.Transport, 2);

        if (netAmount < 0)
            return ServiceResult<SaleResponseDto>.Fail("Net Amount cannot be negative.");

        if (dto.InitialPaymentAmount.HasValue && dto.InitialPaymentAmount.Value > netAmount + 0.01m)
            return ServiceResult<SaleResponseDto>.Fail($"Initial payment ({dto.InitialPaymentAmount.Value:N2}) cannot exceed Net Amount ({netAmount:N2}).");

        var buyerId = await ResolveBuyerIdAsync(dto.BuyerId, dto.Buyer);

        string paymentStatus;
        if (dto.InitialPaymentAmount.HasValue && dto.InitialPaymentAmount.Value > 0)
        {
            paymentStatus = ComputePaymentStatus(netAmount, dto.InitialPaymentAmount.Value);
        }
        else
        {
            paymentStatus = NormalizePaymentStatus(dto.PaymentStatus);
        }

        var sale = new Sale
        {
            SalesNo = salesNo,
            SalesDate = salesDate,
            BuyerId = buyerId,
            Buyer = dto.Buyer.Trim(),
            Farm = dto.Farm.Trim(),
            Crop = primaryCrop,
            Quantity = quantity,
            Unit = primaryUnit,
            Rate = rate,
            GrossAmount = grossAmount,
            Commission = Math.Round(dto.Commission, 2),
            Transport = Math.Round(dto.Transport, 2),
            NetAmount = netAmount,
            PaymentStatus = paymentStatus,
            Remarks = dto.Remarks?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        foreach (var item in builtItems)
        {
            item.SaleId = sale.Id;
        }
        _context.SalesItems.AddRange(builtItems);

        var createdPayments = new List<SalesPayment>();
        if (dto.InitialPaymentAmount.HasValue && dto.InitialPaymentAmount.Value > 0)
        {
            var paymentNo = await GenerateUniquePaymentNoAsync(salesDate);
            var payment = new SalesPayment
            {
                SaleId = sale.Id,
                BuyerId = buyerId,
                PaymentNo = paymentNo,
                PaymentDate = salesDate,
                Buyer = sale.Buyer,
                SalesNo = sale.SalesNo,
                PaymentAmount = Math.Round(dto.InitialPaymentAmount.Value, 2),
                PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank" : dto.PaymentMode.Trim(),
                ReferenceNo = dto.ReferenceNo?.Trim(),
                Remarks = $"Initial payment recorded with sale {sale.SalesNo}",
                CreatedAt = DateTime.UtcNow
            };
            _context.SalesPayments.Add(payment);
            createdPayments.Add(payment);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created Sale ID {Id} ({SalesNo}) with {ItemCount} item(s).", sale.Id, sale.SalesNo, builtItems.Count);
        return ServiceResult<SaleResponseDto>.Ok(MapSale(sale, builtItems, createdPayments), StatusCodes.Status201Created);
    }

    public async Task<ServiceResult<SaleResponseDto>> UpdateSaleAsync(int id, UpdateSaleDto dto)
    {
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales record with ID {id} not found.", StatusCodes.Status404NotFound);

        var oldSalesNo = sale.SalesNo;
        if (!string.IsNullOrWhiteSpace(dto.SalesNo) && !dto.SalesNo.Trim().Equals(sale.SalesNo, StringComparison.OrdinalIgnoreCase))
        {
            var newSalesNo = dto.SalesNo.Trim();
            var conflict = await _context.Sales.AnyAsync(s => s.Id != id && s.SalesNo.ToLower() == newSalesNo.ToLower());
            if (conflict)
                return ServiceResult<SaleResponseDto>.Fail($"SalesNo '{newSalesNo}' is already taken by another record.");
            sale.SalesNo = newSalesNo;
        }

        if (dto.Commission < 0 || dto.Transport < 0)
            return ServiceResult<SaleResponseDto>.Fail("Commission and Transport charges cannot be negative.");

        var hasMultiItems = dto.Items != null && dto.Items.Count > 0;
        var existingItems = await _context.SalesItems
            .Where(i => i.SaleId == sale.Id || i.SalesNo.ToLower() == oldSalesNo.ToLower())
            .ToListAsync();

        decimal grossAmount;
        if (hasMultiItems)
        {
            _context.SalesItems.RemoveRange(existingItems);
            var replacementItems = new List<SalesItem>();
            foreach (var itemDto in dto.Items!)
            {
                if (itemDto.Quantity <= 0 || itemDto.Rate <= 0)
                    return ServiceResult<SaleResponseDto>.Fail("Every line item must have Quantity > 0 and Rate > 0.");

                var lineAmount = itemDto.Amount.HasValue && itemDto.Amount.Value > 0
                    ? Math.Round(itemDto.Amount.Value, 2)
                    : Math.Round(itemDto.Quantity * itemDto.Rate, 2);

                replacementItems.Add(new SalesItem
                {
                    SaleId = sale.Id,
                    SalesNo = sale.SalesNo,
                    Crop = itemDto.Crop.Trim(),
                    Quantity = itemDto.Quantity,
                    Unit = string.IsNullOrWhiteSpace(itemDto.Unit) ? "kg" : itemDto.Unit.Trim(),
                    Rate = itemDto.Rate,
                    Amount = lineAmount,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _context.SalesItems.AddRange(replacementItems);
            grossAmount = Math.Round(replacementItems.Sum(i => i.Amount), 2);
            sale.Quantity = Math.Round(replacementItems.Sum(i => i.Quantity), 2);
            sale.Rate = sale.Quantity > 0 ? Math.Round(grossAmount / sale.Quantity, 2) : 0m;
            sale.Crop = string.IsNullOrWhiteSpace(dto.Crop)
                ? (replacementItems.Count == 1 ? replacementItems[0].Crop : $"{replacementItems[0].Crop} (+{replacementItems.Count - 1} more)")
                : dto.Crop.Trim();
            sale.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? replacementItems[0].Unit : dto.Unit.Trim();
        }
        else
        {
            if (dto.Quantity <= 0 || dto.Rate <= 0)
                return ServiceResult<SaleResponseDto>.Fail("Quantity and Rate must be greater than 0.");

            sale.Crop = string.IsNullOrWhiteSpace(dto.Crop) ? sale.Crop : dto.Crop.Trim();
            sale.Quantity = dto.Quantity;
            sale.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim();
            sale.Rate = dto.Rate;
            grossAmount = dto.GrossAmount.HasValue && dto.GrossAmount.Value > 0
                ? Math.Round(dto.GrossAmount.Value, 2)
                : Math.Round(dto.Quantity * dto.Rate, 2);

            if (existingItems.Count == 1)
            {
                existingItems[0].SaleId = sale.Id;
                existingItems[0].SalesNo = sale.SalesNo;
                existingItems[0].Crop = sale.Crop;
                existingItems[0].Quantity = sale.Quantity;
                existingItems[0].Unit = sale.Unit;
                existingItems[0].Rate = sale.Rate;
                existingItems[0].Amount = grossAmount;
            }
            else if (existingItems.Count == 0)
            {
                _context.SalesItems.Add(new SalesItem
                {
                    SaleId = sale.Id,
                    SalesNo = sale.SalesNo,
                    Crop = sale.Crop,
                    Quantity = sale.Quantity,
                    Unit = sale.Unit,
                    Rate = sale.Rate,
                    Amount = grossAmount,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                foreach (var it in existingItems)
                {
                    it.SaleId = sale.Id;
                    it.SalesNo = sale.SalesNo;
                }
            }
        }

        if (dto.Commission + dto.Transport > grossAmount)
            return ServiceResult<SaleResponseDto>.Fail("Commission + Transport cannot exceed Gross Amount.");

        var netAmount = dto.NetAmount.HasValue && dto.NetAmount.Value > 0 && !hasMultiItems
            ? Math.Round(dto.NetAmount.Value, 2)
            : Math.Round(grossAmount - dto.Commission - dto.Transport, 2);

        sale.SalesDate = dto.SalesDate ?? sale.SalesDate;
        sale.BuyerId = await ResolveBuyerIdAsync(dto.BuyerId, dto.Buyer);
        sale.Buyer = dto.Buyer.Trim();
        sale.Farm = dto.Farm.Trim();
        sale.GrossAmount = grossAmount;
        sale.Commission = Math.Round(dto.Commission, 2);
        sale.Transport = Math.Round(dto.Transport, 2);
        sale.NetAmount = netAmount;
        sale.Remarks = dto.Remarks ?? sale.Remarks;
        sale.UpdatedAt = DateTime.UtcNow;

        // Sync SalesNo / Buyer on existing payments if changed
        var relatedPayments = await _context.SalesPayments
            .Where(p => p.SaleId == sale.Id || p.SalesNo.ToLower() == oldSalesNo.ToLower())
            .ToListAsync();

        foreach (var pay in relatedPayments)
        {
            pay.SaleId = sale.Id;
            pay.SalesNo = sale.SalesNo;
            pay.BuyerId = sale.BuyerId;
            pay.Buyer = sale.Buyer;
        }

        var recordedPaid = relatedPayments.Sum(p => p.PaymentAmount);
        if (recordedPaid > 0)
        {
            sale.PaymentStatus = ComputePaymentStatus(sale.NetAmount, recordedPaid);
        }
        else if (!string.IsNullOrWhiteSpace(dto.PaymentStatus))
        {
            sale.PaymentStatus = NormalizePaymentStatus(dto.PaymentStatus);
        }

        await _context.SaveChangesAsync();

        var updatedDto = await GetSaleByIdAsync(sale.Id);
        return ServiceResult<SaleResponseDto>.Ok(updatedDto!);
    }

    public async Task<ServiceResult<SaleResponseDto>> UpdateSaleStatusAsync(int id, string paymentStatus)
    {
        if (!AllowedPaymentStatuses.Contains(paymentStatus.Trim()))
            return ServiceResult<SaleResponseDto>.Fail("Invalid payment status. Allowed values: Pending, Partially Paid, Paid.");

        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales record with ID {id} not found.", StatusCodes.Status404NotFound);

        sale.PaymentStatus = NormalizePaymentStatus(paymentStatus);
        sale.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updatedDto = await GetSaleByIdAsync(sale.Id);
        return ServiceResult<SaleResponseDto>.Ok(updatedDto!);
    }

    public async Task<ServiceResult<bool>> DeleteSaleAsync(int id)
    {
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null)
            return ServiceResult<bool>.Fail($"Sales record with ID {id} not found.", StatusCodes.Status404NotFound);

        var salesNoLower = sale.SalesNo.ToLower();
        var items = await _context.SalesItems
            .Where(i => i.SaleId == sale.Id || i.SalesNo.ToLower() == salesNoLower)
            .ToListAsync();
        var payments = await _context.SalesPayments
            .Where(p => p.SaleId == sale.Id || p.SalesNo.ToLower() == salesNoLower)
            .ToListAsync();

        _context.SalesItems.RemoveRange(items);
        _context.SalesPayments.RemoveRange(payments);
        _context.Sales.Remove(sale);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted Sale ID {Id} ({SalesNo}) along with {Items} items and {Payments} payments.",
            id, sale.SalesNo, items.Count, payments.Count);
        return ServiceResult<bool>.Ok(true, StatusCodes.Status204NoContent);
    }

    public async Task<string> ExportSalesCsvAsync(SaleQueryParameters query)
    {
        var sales = await ApplySalesFilters(_context.Sales.AsNoTracking().AsQueryable(), query)
            .OrderByDescending(s => s.SalesDate)
            .ThenByDescending(s => s.Id)
            .ToListAsync();

        var (_, _, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(sales);

        var sb = new StringBuilder();
        sb.AppendLine("SalesNo,SalesDate,Buyer,Farm,Crop,Quantity,Unit,Rate,GrossAmount,Commission,Transport,NetAmount,PaidAmount,BalanceAmount,PaymentStatus");

        static string Escape(string? val)
        {
            if (string.IsNullOrEmpty(val)) return "";
            var escaped = val.Replace("\"", "\"\"");
            return escaped.Contains(',') || escaped.Contains('"') || escaped.Contains('\n')
                ? $"\"{escaped}\""
                : escaped;
        }

        foreach (var s in sales)
        {
            var payments = MatchPayments(s, paymentsById, paymentsByNo);
            var paid = ComputeEffectivePaidAmount(s, payments.Sum(p => p.PaymentAmount));
            var balance = Math.Max(0m, Math.Round(s.NetAmount - paid, 2));

            sb.AppendLine(string.Join(",",
                Escape(s.SalesNo),
                s.SalesDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Escape(s.Buyer),
                Escape(s.Farm),
                Escape(s.Crop),
                s.Quantity.ToString("0.00", CultureInfo.InvariantCulture),
                Escape(s.Unit),
                s.Rate.ToString("0.00", CultureInfo.InvariantCulture),
                s.GrossAmount.ToString("0.00", CultureInfo.InvariantCulture),
                s.Commission.ToString("0.00", CultureInfo.InvariantCulture),
                s.Transport.ToString("0.00", CultureInfo.InvariantCulture),
                s.NetAmount.ToString("0.00", CultureInfo.InvariantCulture),
                paid.ToString("0.00", CultureInfo.InvariantCulture),
                balance.ToString("0.00", CultureInfo.InvariantCulture),
                Escape(NormalizePaymentStatus(s.PaymentStatus))));
        }

        return sb.ToString();
    }

    // -------------------------------------------------------------------------
    // 2. SALES ITEMS OPERATIONS (`SalesItems` table)
    // -------------------------------------------------------------------------
    public async Task<ServiceResult<List<SalesItemDto>>> GetSaleItemsAsync(int saleId)
    {
        var sale = await _context.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == saleId);
        if (sale == null)
            return ServiceResult<List<SalesItemDto>>.Fail($"Sales record with ID {saleId} not found.", StatusCodes.Status404NotFound);

        var items = await _context.SalesItems
            .AsNoTracking()
            .Where(i => i.SaleId == saleId || i.SalesNo.ToLower() == sale.SalesNo.ToLower())
            .OrderBy(i => i.Id)
            .ToListAsync();

        return ServiceResult<List<SalesItemDto>>.Ok(items.Select(MapItem).ToList());
    }

    public async Task<ServiceResult<SaleResponseDto>> AddSaleItemAsync(int saleId, CreateSalesItemDto dto)
    {
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId);
        if (sale == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales record with ID {saleId} not found.", StatusCodes.Status404NotFound);

        var amount = dto.Amount.HasValue && dto.Amount.Value > 0
            ? Math.Round(dto.Amount.Value, 2)
            : Math.Round(dto.Quantity * dto.Rate, 2);

        var item = new SalesItem
        {
            SaleId = sale.Id,
            SalesNo = sale.SalesNo,
            Crop = dto.Crop.Trim(),
            Quantity = dto.Quantity,
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim(),
            Rate = dto.Rate,
            Amount = amount,
            CreatedAt = DateTime.UtcNow
        };

        _context.SalesItems.Add(item);
        await _context.SaveChangesAsync();

        await RecalculateSaleFromItemsAsync(sale);
        var updated = await GetSaleByIdAsync(sale.Id);
        return ServiceResult<SaleResponseDto>.Ok(updated!, StatusCodes.Status201Created);
    }

    public async Task<ServiceResult<SaleResponseDto>> UpdateSaleItemAsync(int saleId, int itemId, UpdateSalesItemDto dto)
    {
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId);
        if (sale == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales record with ID {saleId} not found.", StatusCodes.Status404NotFound);

        var item = await _context.SalesItems.FirstOrDefaultAsync(i =>
            i.Id == itemId && (i.SaleId == saleId || i.SalesNo.ToLower() == sale.SalesNo.ToLower()));
        if (item == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales item ID {itemId} not found for sale ID {saleId}.", StatusCodes.Status404NotFound);

        item.SaleId = sale.Id;
        item.SalesNo = sale.SalesNo;
        item.Crop = dto.Crop.Trim();
        item.Quantity = dto.Quantity;
        item.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim();
        item.Rate = dto.Rate;
        item.Amount = dto.Amount.HasValue && dto.Amount.Value > 0
            ? Math.Round(dto.Amount.Value, 2)
            : Math.Round(dto.Quantity * dto.Rate, 2);

        await _context.SaveChangesAsync();
        await RecalculateSaleFromItemsAsync(sale);

        var updated = await GetSaleByIdAsync(sale.Id);
        return ServiceResult<SaleResponseDto>.Ok(updated!);
    }

    public async Task<ServiceResult<SaleResponseDto>> DeleteSaleItemAsync(int saleId, int itemId)
    {
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId);
        if (sale == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales record with ID {saleId} not found.", StatusCodes.Status404NotFound);

        var items = await _context.SalesItems
            .Where(i => i.SaleId == saleId || i.SalesNo.ToLower() == sale.SalesNo.ToLower())
            .ToListAsync();

        var item = items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            return ServiceResult<SaleResponseDto>.Fail($"Sales item ID {itemId} not found for sale ID {saleId}.", StatusCodes.Status404NotFound);

        if (items.Count <= 1)
            return ServiceResult<SaleResponseDto>.Fail("Cannot delete the last line item of a sale. Delete the sale instead.");

        _context.SalesItems.Remove(item);
        await _context.SaveChangesAsync();

        await RecalculateSaleFromItemsAsync(sale);
        var updated = await GetSaleByIdAsync(sale.Id);
        return ServiceResult<SaleResponseDto>.Ok(updated!);
    }

    private async Task RecalculateSaleFromItemsAsync(Sale sale)
    {
        var items = await _context.SalesItems
            .Where(i => i.SaleId == sale.Id || i.SalesNo.ToLower() == sale.SalesNo.ToLower())
            .OrderBy(i => i.Id)
            .ToListAsync();

        if (items.Count == 0) return;

        sale.Quantity = Math.Round(items.Sum(i => i.Quantity), 2);
        sale.GrossAmount = Math.Round(items.Sum(i => i.Amount), 2);
        sale.Rate = sale.Quantity > 0 ? Math.Round(sale.GrossAmount / sale.Quantity, 2) : 0m;
        sale.NetAmount = Math.Max(0m, Math.Round(sale.GrossAmount - sale.Commission - sale.Transport, 2));
        sale.Crop = items.Count == 1 ? items[0].Crop : $"{items[0].Crop} (+{items.Count - 1} more)";
        sale.Unit = items[0].Unit;
        sale.UpdatedAt = DateTime.UtcNow;

        var recordedPaid = await GetRecordedPaidForSaleAsync(sale);
        if (recordedPaid > 0)
        {
            sale.PaymentStatus = ComputePaymentStatus(sale.NetAmount, recordedPaid);
        }

        await _context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 3. SALES PAYMENTS & RECEIVABLES (`SalesPayments` table)
    // -------------------------------------------------------------------------
    public async Task<List<SalesPaymentResponseDto>> GetPaymentsAsync(
        string? search, string? buyer, string? salesNo, string? paymentMode, DateTime? fromDate, DateTime? toDate)
    {
        var query = _context.SalesPayments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.PaymentNo.ToLower().Contains(term) ||
                p.Buyer.ToLower().Contains(term) ||
                p.SalesNo.ToLower().Contains(term) ||
                (p.ReferenceNo != null && p.ReferenceNo.ToLower().Contains(term)) ||
                (p.Remarks != null && p.Remarks.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(buyer) && !buyer.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var b = buyer.Trim().ToLower();
            query = query.Where(p => p.Buyer.ToLower() == b);
        }

        if (!string.IsNullOrWhiteSpace(salesNo))
        {
            var sno = salesNo.Trim().ToLower();
            query = query.Where(p => p.SalesNo.ToLower() == sno);
        }

        if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var mode = paymentMode.Trim().ToLower();
            query = query.Where(p => p.PaymentMode.ToLower() == mode);
        }

        if (fromDate.HasValue)
            query = query.Where(p => p.PaymentDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(p => p.PaymentDate <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        var list = await query
            .OrderByDescending(p => p.PaymentDate)
            .ThenByDescending(p => p.Id)
            .ToListAsync();

        return list.Select(p => MapPayment(p)).ToList();
    }

    public async Task<SalesPaymentResponseDto?> GetPaymentByIdAsync(int id)
    {
        var payment = await _context.SalesPayments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return payment == null ? null : MapPayment(payment);
    }

    public async Task<SalesPaymentSummaryDto> GetPaymentsSummaryAsync()
    {
        var payments = await _context.SalesPayments.AsNoTracking().ToListAsync();
        var receivables = await GetReceivablesAsync();

        var byMode = payments
            .GroupBy(p => string.IsNullOrWhiteSpace(p.PaymentMode) ? "Bank" : p.PaymentMode)
            .Select(g => new PaymentModeBreakdownDto
            {
                PaymentMode = g.Key,
                Count = g.Count(),
                TotalAmount = Math.Round(g.Sum(p => p.PaymentAmount), 2)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        return new SalesPaymentSummaryDto
        {
            TotalPaymentsCount = payments.Count,
            TotalAmountReceived = receivables.TotalAmountReceived,
            TotalSalesInvoiced = receivables.TotalReceivablesInvoiced,
            TotalOutstandingReceivables = receivables.TotalOutstanding,
            PendingInvoicesCount = receivables.PendingInvoicesCount + receivables.PartiallyPaidInvoicesCount,
            ByMode = byMode
        };
    }

    public async Task<ServiceResult<SalesPaymentResponseDto>> CreatePaymentAsync(CreateSalesPaymentDto dto)
    {
        if (dto.PaymentAmount <= 0)
            return ServiceResult<SalesPaymentResponseDto>.Fail("Payment amount must be greater than 0.");

        Sale? sale = null;
        if (dto.SaleId.HasValue)
        {
            sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == dto.SaleId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(dto.SalesNo))
        {
            var sno = dto.SalesNo.Trim().ToLower();
            sale = await _context.Sales.FirstOrDefaultAsync(s => s.SalesNo.ToLower() == sno);
        }

        if (sale == null)
            return ServiceResult<SalesPaymentResponseDto>.Fail(
                $"Referenced sales record '{dto.SalesNo ?? dto.SaleId?.ToString()}' was not found.",
                StatusCodes.Status404NotFound);

        var previousPaid = await GetRecordedPaidForSaleAsync(sale);
        var remainingBalance = Math.Max(0m, Math.Round(sale.NetAmount - previousPaid, 2));

        if (remainingBalance <= 0.01m && NormalizePaymentStatus(sale.PaymentStatus) == "Paid")
            return ServiceResult<SalesPaymentResponseDto>.Fail($"Sale '{sale.SalesNo}' is already fully paid.");

        if (dto.PaymentAmount > remainingBalance + 0.01m)
            return ServiceResult<SalesPaymentResponseDto>.Fail(
                $"Payment amount ({dto.PaymentAmount:N2}) exceeds remaining outstanding balance ({remainingBalance:N2}) for sale '{sale.SalesNo}'.");

        var paymentDate = dto.PaymentDate ?? DateTime.UtcNow;
        var paymentNo = dto.PaymentNo?.Trim();
        if (string.IsNullOrWhiteSpace(paymentNo))
        {
            paymentNo = await GenerateUniquePaymentNoAsync(paymentDate);
        }
        else
        {
            var duplicateNo = await _context.SalesPayments.AnyAsync(p => p.PaymentNo.ToLower() == paymentNo.ToLower());
            if (duplicateNo)
                return ServiceResult<SalesPaymentResponseDto>.Fail($"Payment number '{paymentNo}' already exists.");
        }

        var buyerName = string.IsNullOrWhiteSpace(dto.Buyer) ? sale.Buyer : dto.Buyer.Trim();
        var buyerId = sale.BuyerId ?? await ResolveBuyerIdAsync(dto.BuyerId, buyerName);

        var payment = new SalesPayment
        {
            SaleId = sale.Id,
            BuyerId = buyerId,
            PaymentNo = paymentNo,
            PaymentDate = paymentDate,
            Buyer = buyerName,
            SalesNo = sale.SalesNo,
            PaymentAmount = Math.Round(dto.PaymentAmount, 2),
            PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank" : dto.PaymentMode.Trim(),
            ReferenceNo = dto.ReferenceNo?.Trim(),
            Remarks = dto.Remarks?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.SalesPayments.Add(payment);

        var newTotalPaid = Math.Round(previousPaid + payment.PaymentAmount, 2);
        sale.PaymentStatus = ComputePaymentStatus(sale.NetAmount, newTotalPaid);
        sale.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var newRemaining = Math.Max(0m, Math.Round(sale.NetAmount - newTotalPaid, 2));
        _logger.LogInformation("Recorded SalesPayment {PaymentNo} for {SalesNo}: {Amount} ({Status})",
            payment.PaymentNo, sale.SalesNo, payment.PaymentAmount, sale.PaymentStatus);

        return ServiceResult<SalesPaymentResponseDto>.Ok(
            MapPayment(payment, sale.PaymentStatus, newRemaining),
            StatusCodes.Status201Created);
    }

    public async Task<ServiceResult<SalesPaymentResponseDto>> UpdatePaymentAsync(int id, UpdateSalesPaymentDto dto)
    {
        var payment = await _context.SalesPayments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
            return ServiceResult<SalesPaymentResponseDto>.Fail($"Payment record with ID {id} not found.", StatusCodes.Status404NotFound);

        if (dto.PaymentAmount <= 0)
            return ServiceResult<SalesPaymentResponseDto>.Fail("Payment amount must be greater than 0.");

        var sale = await _context.Sales.FirstOrDefaultAsync(s =>
            (payment.SaleId.HasValue && s.Id == payment.SaleId.Value) ||
            s.SalesNo.ToLower() == payment.SalesNo.ToLower());

        decimal? remaining = null;
        string? saleStatus = null;

        if (sale != null)
        {
            var otherPaymentsSum = await _context.SalesPayments
                .Where(p => p.Id != id && (p.SaleId == sale.Id || p.SalesNo.ToLower() == sale.SalesNo.ToLower()))
                .SumAsync(p => (decimal?)p.PaymentAmount) ?? 0m;

            var maxAllowed = Math.Max(0m, Math.Round(sale.NetAmount - otherPaymentsSum, 2));
            if (dto.PaymentAmount > maxAllowed + 0.01m)
                return ServiceResult<SalesPaymentResponseDto>.Fail(
                    $"Updated payment amount ({dto.PaymentAmount:N2}) exceeds remaining balance ({maxAllowed:N2}) for sale '{sale.SalesNo}'.");

            payment.PaymentAmount = Math.Round(dto.PaymentAmount, 2);
            payment.PaymentDate = dto.PaymentDate ?? payment.PaymentDate;
            payment.PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? payment.PaymentMode : dto.PaymentMode.Trim();
            payment.ReferenceNo = dto.ReferenceNo?.Trim();
            payment.Remarks = dto.Remarks?.Trim();
            payment.UpdatedAt = DateTime.UtcNow;

            var totalPaid = Math.Round(otherPaymentsSum + payment.PaymentAmount, 2);
            sale.PaymentStatus = ComputePaymentStatus(sale.NetAmount, totalPaid);
            sale.UpdatedAt = DateTime.UtcNow;

            saleStatus = sale.PaymentStatus;
            remaining = Math.Max(0m, Math.Round(sale.NetAmount - totalPaid, 2));
        }
        else
        {
            payment.PaymentAmount = Math.Round(dto.PaymentAmount, 2);
            payment.PaymentDate = dto.PaymentDate ?? payment.PaymentDate;
            payment.PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? payment.PaymentMode : dto.PaymentMode.Trim();
            payment.ReferenceNo = dto.ReferenceNo?.Trim();
            payment.Remarks = dto.Remarks?.Trim();
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ServiceResult<SalesPaymentResponseDto>.Ok(MapPayment(payment, saleStatus, remaining));
    }

    public async Task<ServiceResult<bool>> DeletePaymentAsync(int id)
    {
        var payment = await _context.SalesPayments.FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
            return ServiceResult<bool>.Fail($"Payment record with ID {id} not found.", StatusCodes.Status404NotFound);

        var saleId = payment.SaleId;
        var salesNo = payment.SalesNo;

        _context.SalesPayments.Remove(payment);
        await _context.SaveChangesAsync();

        var sale = await _context.Sales.FirstOrDefaultAsync(s =>
            (saleId.HasValue && s.Id == saleId.Value) ||
            s.SalesNo.ToLower() == salesNo.ToLower());

        if (sale != null)
        {
            await RecalculateSalePaymentStatusAsync(sale);
            await _context.SaveChangesAsync();
        }

        return ServiceResult<bool>.Ok(true, StatusCodes.Status204NoContent);
    }

    public async Task<ReceivablesOverviewDto> GetReceivablesAsync(string? search = null, string? buyer = null, string? status = null)
    {
        var sales = await _context.Sales
            .AsNoTracking()
            .OrderByDescending(s => s.SalesDate)
            .ThenByDescending(s => s.Id)
            .ToListAsync();

        var (_, _, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(sales);

        var allItems = sales.Select(sale =>
        {
            var related = MatchPayments(sale, paymentsById, paymentsByNo);
            var effectiveReceived = ComputeEffectivePaidAmount(sale, related.Sum(p => p.PaymentAmount));
            var outstanding = Math.Max(0m, Math.Round(sale.NetAmount - effectiveReceived, 2));
            var computedStatus = related.Count > 0
                ? ComputePaymentStatus(sale.NetAmount, effectiveReceived)
                : NormalizePaymentStatus(sale.PaymentStatus);

            return new ReceivableItemDto
            {
                Id = sale.Id,
                SalesNo = sale.SalesNo,
                SalesDate = sale.SalesDate,
                BuyerId = sale.BuyerId,
                Buyer = sale.Buyer,
                Farm = sale.Farm,
                Crop = sale.Crop,
                GrossAmount = sale.GrossAmount,
                TotalSalesAmount = sale.NetAmount,
                AmountReceived = effectiveReceived,
                OutstandingAmount = outstanding,
                PaymentStatus = computedStatus,
                PaymentsCount = related.Count,
                Payments = related.Select(p => MapPayment(p)).ToList()
            };
        }).ToList();

        var filtered = allItems.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            filtered = filtered.Where(r =>
                r.SalesNo.ToLower().Contains(q) ||
                r.Buyer.ToLower().Contains(q) ||
                r.Crop.ToLower().Contains(q) ||
                r.Farm.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(buyer) && !buyer.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var b = buyer.Trim().ToLower();
            filtered = filtered.Where(r => r.Buyer.ToLower() == b);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var st = NormalizePaymentStatus(status);
            filtered = filtered.Where(r => r.PaymentStatus.Equals(st, StringComparison.OrdinalIgnoreCase));
        }

        var itemsList = filtered.ToList();

        return new ReceivablesOverviewDto
        {
            TotalReceivablesInvoiced = Math.Round(itemsList.Sum(r => r.TotalSalesAmount), 2),
            TotalAmountReceived = Math.Round(itemsList.Sum(r => r.AmountReceived), 2),
            TotalOutstanding = Math.Round(itemsList.Sum(r => r.OutstandingAmount), 2),
            PendingInvoicesCount = itemsList.Count(r => r.PaymentStatus == "Pending"),
            PartiallyPaidInvoicesCount = itemsList.Count(r => r.PaymentStatus == "Partially Paid"),
            PaidInvoicesCount = itemsList.Count(r => r.PaymentStatus == "Paid"),
            Items = itemsList
        };
    }

    public async Task<ServiceResult<ReceivableItemDto>> SyncReceivableAsync(string salesNo, SyncReceivableDto dto)
    {
        var sno = salesNo.Trim().ToLower();
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.SalesNo.ToLower() == sno);
        if (sale == null)
            return ServiceResult<ReceivableItemDto>.Fail($"Sales record '{salesNo}' not found.", StatusCodes.Status404NotFound);

        var targetTotal = dto.TotalSalesAmount.HasValue && dto.TotalSalesAmount.Value > 0
            ? Math.Round(dto.TotalSalesAmount.Value, 2)
            : sale.NetAmount;

        if (dto.AmountReceived < 0 || dto.AmountReceived > targetTotal + 0.01m)
            return ServiceResult<ReceivableItemDto>.Fail(
                $"Amount received ({dto.AmountReceived:N2}) must be between 0 and Total Sales Amount ({targetTotal:N2}).");

        sale.NetAmount = targetTotal;
        if (sale.GrossAmount < targetTotal) sale.GrossAmount = targetTotal;
        if (!string.IsNullOrWhiteSpace(dto.Buyer))
        {
            sale.Buyer = dto.Buyer.Trim();
            sale.BuyerId = await ResolveBuyerIdAsync(sale.BuyerId, sale.Buyer);
        }
        if (dto.SalesDate.HasValue) sale.SalesDate = dto.SalesDate.Value;

        var existingPayments = await _context.SalesPayments
            .Where(p => p.SaleId == sale.Id || p.SalesNo.ToLower() == sno)
            .OrderBy(p => p.Id)
            .ToListAsync();

        var currentReceived = existingPayments.Sum(p => p.PaymentAmount);
        var diff = Math.Round(dto.AmountReceived - currentReceived, 2);

        if (diff > 0.01m)
        {
            var paymentNo = await GenerateUniquePaymentNoAsync(dto.SalesDate ?? DateTime.UtcNow);
            _context.SalesPayments.Add(new SalesPayment
            {
                SaleId = sale.Id,
                BuyerId = sale.BuyerId,
                PaymentNo = paymentNo,
                PaymentDate = dto.SalesDate ?? DateTime.UtcNow,
                Buyer = sale.Buyer,
                SalesNo = sale.SalesNo,
                PaymentAmount = diff,
                PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank" : dto.PaymentMode.Trim(),
                ReferenceNo = dto.ReferenceNo?.Trim(),
                Remarks = string.IsNullOrWhiteSpace(dto.Remarks)
                    ? $"Receivable settlement for {sale.SalesNo}"
                    : dto.Remarks.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (diff < -0.01m && existingPayments.Count > 0)
        {
            // Adjust the latest payment voucher downward if total received was corrected
            var latest = existingPayments[^1];
            var adjusted = Math.Round(latest.PaymentAmount + diff, 2);
            if (adjusted <= 0)
            {
                _context.SalesPayments.Remove(latest);
            }
            else
            {
                latest.PaymentAmount = adjusted;
                latest.UpdatedAt = DateTime.UtcNow;
            }
        }

        sale.PaymentStatus = !string.IsNullOrWhiteSpace(dto.PaymentStatus)
            ? NormalizePaymentStatus(dto.PaymentStatus)
            : ComputePaymentStatus(sale.NetAmount, dto.AmountReceived);
        sale.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var refreshed = await GetReceivablesAsync(search: sale.SalesNo);
        var item = refreshed.Items.FirstOrDefault(r => r.SalesNo.Equals(sale.SalesNo, StringComparison.OrdinalIgnoreCase));
        return ServiceResult<ReceivableItemDto>.Ok(item!);
    }

    // -------------------------------------------------------------------------
    // 4. BUYERS / CUSTOMERS (`Buyers` table)
    // -------------------------------------------------------------------------
    public async Task<List<BuyerResponseDto>> GetBuyersAsync(string? search, string? status)
    {
        var query = _context.Buyers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(b =>
                b.BuyerCode.ToLower().Contains(term) ||
                b.BuyerName.ToLower().Contains(term) ||
                b.Mobile.ToLower().Contains(term) ||
                (b.BusinessName != null && b.BusinessName.ToLower().Contains(term)) ||
                (b.Gstin != null && b.Gstin.ToLower().Contains(term)) ||
                (b.Address != null && b.Address.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var st = status.Trim().ToLower();
            query = query.Where(b => b.Status.ToLower() == st);
        }

        var buyers = await query.OrderBy(b => b.BuyerName).ToListAsync();
        var allSales = await _context.Sales.AsNoTracking().ToListAsync();
        var allPayments = await _context.SalesPayments.AsNoTracking().ToListAsync();

        return buyers.Select(b => BuildBuyerResponse(b, allSales, allPayments)).ToList();
    }

    public async Task<BuyerResponseDto?> GetBuyerByIdAsync(int id)
    {
        var buyer = await _context.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null) return null;

        var sales = await _context.Sales
            .AsNoTracking()
            .Where(s => s.BuyerId == buyer.Id || s.Buyer.ToLower() == buyer.BuyerName.ToLower())
            .ToListAsync();
        var payments = await _context.SalesPayments
            .AsNoTracking()
            .Where(p => p.BuyerId == buyer.Id || p.Buyer.ToLower() == buyer.BuyerName.ToLower())
            .ToListAsync();

        return BuildBuyerResponse(buyer, sales, payments);
    }

    public async Task<BuyerSummaryDto> GetBuyersSummaryAsync()
    {
        var buyers = await GetBuyersAsync(null, null);
        return new BuyerSummaryDto
        {
            TotalBuyers = buyers.Count,
            ActiveBuyers = buyers.Count(b => b.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)),
            InactiveBuyers = buyers.Count(b => !b.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)),
            TotalOpeningBalance = Math.Round(buyers.Sum(b => b.OpeningBalance), 2),
            TotalAssociatedSales = buyers.Sum(b => b.TotalSalesCount),
            TotalSalesAmount = Math.Round(buyers.Sum(b => b.TotalSalesAmount), 2),
            TotalPaidAmount = Math.Round(buyers.Sum(b => b.TotalPaidAmount), 2),
            TotalOutstandingReceivables = Math.Round(buyers.Sum(b => b.OutstandingBalance), 2)
        };
    }

    public async Task<BuyerLedgerDto?> GetBuyerLedgerAsync(int id)
    {
        var buyer = await _context.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null) return null;

        var nameLower = buyer.BuyerName.ToLower();
        var sales = await _context.Sales
            .AsNoTracking()
            .Where(s => s.BuyerId == buyer.Id || s.Buyer.ToLower() == nameLower)
            .OrderByDescending(s => s.SalesDate)
            .ThenByDescending(s => s.Id)
            .ToListAsync();

        var payments = await _context.SalesPayments
            .AsNoTracking()
            .Where(p => p.BuyerId == buyer.Id || p.Buyer.ToLower() == nameLower)
            .OrderByDescending(p => p.PaymentDate)
            .ThenByDescending(p => p.Id)
            .ToListAsync();

        var (itemsById, itemsByNo, paymentsById, paymentsByNo) = await LoadRelatedForSalesAsync(sales);

        return new BuyerLedgerDto
        {
            Buyer = BuildBuyerResponse(buyer, sales, payments),
            Sales = sales.Select(s => MapSale(s, MatchItems(s, itemsById, itemsByNo), MatchPayments(s, paymentsById, paymentsByNo))).ToList(),
            Payments = payments.Select(p => MapPayment(p)).ToList()
        };
    }

    public async Task<ServiceResult<BuyerResponseDto>> CreateBuyerAsync(CreateBuyerDto dto)
    {
        if (dto.OpeningBalance < 0)
            return ServiceResult<BuyerResponseDto>.Fail("Opening balance cannot be negative.");

        var buyerCode = dto.BuyerCode?.Trim();
        if (string.IsNullOrWhiteSpace(buyerCode))
        {
            buyerCode = await GenerateUniqueBuyerCodeAsync();
        }
        else
        {
            var exists = await _context.Buyers.AnyAsync(b => b.BuyerCode.ToLower() == buyerCode.ToLower());
            if (exists)
                return ServiceResult<BuyerResponseDto>.Fail($"Buyer code '{buyerCode}' already exists.");
        }

        var normalizedMobile = new string(dto.Mobile.Where(char.IsDigit).ToArray());
        if (!string.IsNullOrEmpty(normalizedMobile))
        {
            var existingMobiles = await _context.Buyers.AsNoTracking().Select(b => b.Mobile).ToListAsync();
            if (existingMobiles.Any(m => new string(m.Where(char.IsDigit).ToArray()) == normalizedMobile))
                return ServiceResult<BuyerResponseDto>.Fail($"A buyer with mobile '{dto.Mobile.Trim()}' already exists.");
        }

        var buyer = new Buyer
        {
            BuyerCode = buyerCode,
            BuyerName = dto.BuyerName.Trim(),
            Mobile = dto.Mobile.Trim(),
            Address = dto.Address?.Trim(),
            BusinessName = dto.BusinessName?.Trim(),
            Gstin = dto.Gstin?.Trim().ToUpperInvariant(),
            OpeningBalance = Math.Round(dto.OpeningBalance, 2),
            Status = AllowedBuyerStatuses.Contains(dto.Status?.Trim() ?? "") ? dto.Status!.Trim() : "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Buyers.Add(buyer);
        await _context.SaveChangesAsync();

        var result = await GetBuyerByIdAsync(buyer.Id);
        return ServiceResult<BuyerResponseDto>.Ok(result!, StatusCodes.Status201Created);
    }

    public async Task<ServiceResult<BuyerResponseDto>> UpdateBuyerAsync(int id, UpdateBuyerDto dto)
    {
        var buyer = await _context.Buyers.FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null)
            return ServiceResult<BuyerResponseDto>.Fail($"Buyer with ID {id} not found.", StatusCodes.Status404NotFound);

        if (dto.OpeningBalance < 0)
            return ServiceResult<BuyerResponseDto>.Fail("Opening balance cannot be negative.");

        if (!string.IsNullOrWhiteSpace(dto.BuyerCode) && !dto.BuyerCode.Trim().Equals(buyer.BuyerCode, StringComparison.OrdinalIgnoreCase))
        {
            var newCode = dto.BuyerCode.Trim();
            var codeConflict = await _context.Buyers.AnyAsync(b => b.Id != id && b.BuyerCode.ToLower() == newCode.ToLower());
            if (codeConflict)
                return ServiceResult<BuyerResponseDto>.Fail($"Buyer code '{newCode}' is already in use.");
            buyer.BuyerCode = newCode;
        }

        var normalizedMobile = new string(dto.Mobile.Where(char.IsDigit).ToArray());
        if (!string.IsNullOrEmpty(normalizedMobile))
        {
            var otherMobiles = await _context.Buyers
                .AsNoTracking()
                .Where(b => b.Id != id)
                .Select(b => b.Mobile)
                .ToListAsync();
            if (otherMobiles.Any(m => new string(m.Where(char.IsDigit).ToArray()) == normalizedMobile))
                return ServiceResult<BuyerResponseDto>.Fail($"A buyer with mobile '{dto.Mobile.Trim()}' already exists.");
        }

        var oldName = buyer.BuyerName;
        buyer.BuyerName = dto.BuyerName.Trim();
        buyer.Mobile = dto.Mobile.Trim();
        buyer.Address = dto.Address?.Trim();
        buyer.BusinessName = dto.BusinessName?.Trim();
        buyer.Gstin = dto.Gstin?.Trim().ToUpperInvariant();
        buyer.OpeningBalance = Math.Round(dto.OpeningBalance, 2);
        if (!string.IsNullOrWhiteSpace(dto.Status) && AllowedBuyerStatuses.Contains(dto.Status.Trim()))
        {
            buyer.Status = dto.Status.Trim();
        }
        buyer.UpdatedAt = DateTime.UtcNow;

        // Keep buyer name in sync on linked sales/payments if renamed
        if (!oldName.Equals(buyer.BuyerName, StringComparison.Ordinal))
        {
            var linkedSales = await _context.Sales
                .Where(s => s.BuyerId == buyer.Id || s.Buyer.ToLower() == oldName.ToLower())
                .ToListAsync();
            foreach (var s in linkedSales)
            {
                s.BuyerId = buyer.Id;
                s.Buyer = buyer.BuyerName;
            }

            var linkedPayments = await _context.SalesPayments
                .Where(p => p.BuyerId == buyer.Id || p.Buyer.ToLower() == oldName.ToLower())
                .ToListAsync();
            foreach (var p in linkedPayments)
            {
                p.BuyerId = buyer.Id;
                p.Buyer = buyer.BuyerName;
            }
        }

        await _context.SaveChangesAsync();

        var result = await GetBuyerByIdAsync(buyer.Id);
        return ServiceResult<BuyerResponseDto>.Ok(result!);
    }

    public async Task<ServiceResult<BuyerResponseDto>> UpdateBuyerStatusAsync(int id, string status)
    {
        if (!AllowedBuyerStatuses.Contains(status.Trim()))
            return ServiceResult<BuyerResponseDto>.Fail("Invalid buyer status. Allowed values: Active, Inactive.");

        var buyer = await _context.Buyers.FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null)
            return ServiceResult<BuyerResponseDto>.Fail($"Buyer with ID {id} not found.", StatusCodes.Status404NotFound);

        buyer.Status = status.Trim();
        buyer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var result = await GetBuyerByIdAsync(buyer.Id);
        return ServiceResult<BuyerResponseDto>.Ok(result!);
    }

    public async Task<ServiceResult<bool>> DeleteBuyerAsync(int id)
    {
        var buyer = await _context.Buyers.FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null)
            return ServiceResult<bool>.Fail($"Buyer with ID {id} not found.", StatusCodes.Status404NotFound);

        // Preserve historical sales & payments by clearing the optional BuyerId FK
        var linkedSales = await _context.Sales.Where(s => s.BuyerId == id).ToListAsync();
        foreach (var s in linkedSales) s.BuyerId = null;

        var linkedPayments = await _context.SalesPayments.Where(p => p.BuyerId == id).ToListAsync();
        foreach (var p in linkedPayments) p.BuyerId = null;

        _context.Buyers.Remove(buyer);
        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true, StatusCodes.Status204NoContent);
    }

    private static BuyerResponseDto BuildBuyerResponse(Buyer b, List<Sale> allSales, List<SalesPayment> allPayments)
    {
        var nameLower = b.BuyerName.ToLower();
        var buyerSales = allSales
            .Where(s => s.BuyerId == b.Id || s.Buyer.ToLower() == nameLower)
            .ToList();

        var saleNos = buyerSales.Select(s => s.SalesNo.ToLower()).ToHashSet();
        var buyerPayments = allPayments
            .Where(p => p.BuyerId == b.Id || p.Buyer.ToLower() == nameLower || saleNos.Contains(p.SalesNo.ToLower()))
            .ToList();

        var totalSales = Math.Round(buyerSales.Sum(s => s.NetAmount), 2);
        var totalPaid = 0m;
        foreach (var s in buyerSales)
        {
            var salePaySum = buyerPayments
                .Where(p => p.SaleId == s.Id || p.SalesNo.Equals(s.SalesNo, StringComparison.OrdinalIgnoreCase))
                .Sum(p => p.PaymentAmount);
            totalPaid += ComputeEffectivePaidAmount(s, salePaySum);
        }
        totalPaid = Math.Round(totalPaid, 2);

        var outstanding = Math.Max(0m, Math.Round(b.OpeningBalance + totalSales - totalPaid, 2));

        return new BuyerResponseDto
        {
            Id = b.Id,
            BuyerCode = b.BuyerCode,
            BuyerName = b.BuyerName,
            Mobile = b.Mobile,
            Address = b.Address,
            BusinessName = b.BusinessName,
            Gstin = b.Gstin,
            OpeningBalance = b.OpeningBalance,
            Status = b.Status,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            TotalSalesCount = buyerSales.Count,
            TotalSalesAmount = totalSales,
            TotalPaidAmount = totalPaid,
            OutstandingBalance = outstanding
        };
    }
}
