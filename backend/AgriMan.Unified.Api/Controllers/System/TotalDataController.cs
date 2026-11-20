using AgriMan.Api.Data;
using AgriMan.Expenses.Api.Data;
using Agriman.Machinery.Api.Data;
using FarmManagementApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;

namespace AgriMan.Unified.Api.Controllers.System;

[ApiController]
[Route("api/total-data")]
[Produces("application/json")]
public class TotalDataController : ControllerBase
{
    private readonly ApplicationDbContext _authDb;
    private readonly FarmDbContext _farmDb;
    private readonly ExpenseDbContext _expenseDb;
    private readonly SalesDbContext _salesDb;
    private readonly MachineryDbContext _machineryDb;

    public TotalDataController(
        ApplicationDbContext authDb,
        FarmDbContext farmDb,
        ExpenseDbContext expenseDb,
        SalesDbContext salesDb,
        MachineryDbContext machineryDb)
    {
        _authDb = authDb;
        _farmDb = farmDb;
        _expenseDb = expenseDb;
        _salesDb = salesDb;
        _machineryDb = machineryDb;
    }

    /// <summary>
    /// Get unified totals and summary metrics across all 9 AGRIMAN modules stored in Farmersdb.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await BuildSummaryAsync(cancellationToken);
        return Ok(new
        {
            database = "Farmersdb",
            server = "NIRANJAN\\SQLEXPRESS",
            generatedAtUtc = DateTime.UtcNow,
            summary
        });
    }

    /// <summary>
    /// Get total combined platform data (summary + records from all modules) from Farmersdb in a single response.
    /// </summary>
    /// <param name="maxRowsPerModule">Maximum rows returned per module (default 50, max 500)</param>
    /// <param name="includeRecords">Set false to return summary metrics only</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    public async Task<IActionResult> GetTotalData(
        [FromQuery] int maxRowsPerModule = 50,
        [FromQuery] bool includeRecords = true,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(maxRowsPerModule, 1, 500);
        var summary = await BuildSummaryAsync(cancellationToken);

        if (!includeRecords)
        {
            return Ok(new
            {
                database = "Farmersdb",
                server = "NIRANJAN\\SQLEXPRESS",
                generatedAtUtc = DateTime.UtcNow,
                summary
            });
        }

        var users = await _authDb.Users.AsNoTracking()
            .OrderByDescending(u => u.Id)
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                u.UserCode,
                u.Name,
                u.Email,
                u.MobileNumber,
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var roles = await _authDb.Roles.AsNoTracking()
            .OrderBy(r => r.Id)
            .Select(r => new { r.Id, r.Name, r.Description })
            .ToListAsync(cancellationToken);

        var farmers = await _farmDb.Farmers.AsNoTracking()
            .OrderByDescending(f => f.Id)
            .Take(limit)
            .Select(f => new
            {
                f.Id,
                f.FarmerCode,
                f.FarmerName,
                f.Mobile,
                f.Email,
                f.Village,
                f.District,
                f.TotalLand,
                f.Status,
                f.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var farms = await _farmDb.Farms.AsNoTracking()
            .OrderByDescending(f => f.Id)
            .Take(limit)
            .Select(f => new
            {
                f.Id,
                f.FarmerId,
                f.FarmName,
                f.OwnershipType,
                f.Village,
                f.Mandal,
                f.District,
                f.State,
                f.Status,
                f.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var landDetails = await _farmDb.FarmLandDetails.AsNoTracking()
            .OrderByDescending(l => l.Id)
            .Take(limit)
            .Select(l => new
            {
                l.Id,
                l.FarmId,
                l.SurveyNumber,
                l.LandArea,
                l.AreaUnit,
                l.LandType,
                l.IrrigationSourceId,
                l.SoilTypeId
            })
            .ToListAsync(cancellationToken);

        var income = await _farmDb.IncomeTransactions.AsNoTracking()
            .OrderByDescending(i => i.IncomeDate)
            .ThenByDescending(i => i.Id)
            .Take(limit)
            .Select(i => new
            {
                i.Id,
                i.IncomeNo,
                i.IncomeDate,
                i.CategoryId,
                i.FarmerId,
                i.Farm,
                i.Crop,
                i.Buyer,
                i.GrossAmount,
                i.Discount,
                i.OtherCharges,
                i.NetAmount,
                i.Status
            })
            .ToListAsync(cancellationToken);

        var suppliers = await _farmDb.Suppliers.AsNoTracking()
            .OrderByDescending(s => s.Id)
            .Take(limit)
            .Select(s => new
            {
                s.Id,
                s.FarmerId,
                s.Name,
                s.ContactPerson,
                s.Phone,
                s.Email,
                s.GstNumber
            })
            .ToListAsync(cancellationToken);

        var purchases = await _farmDb.Purchases.AsNoTracking()
            .OrderByDescending(p => p.PurchaseDate)
            .ThenByDescending(p => p.Id)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.PurchaseNo,
                p.PurchaseDate,
                p.FarmerId,
                p.SupplierId,
                p.TotalAmount,
                p.PaidAmount,
                p.BalanceAmount,
                p.PaymentStatus
            })
            .ToListAsync(cancellationToken);

        var products = await _farmDb.Products.AsNoTracking()
            .OrderByDescending(p => p.Id)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.CategoryId,
                p.UnitId,
                p.ReorderLevel,
                p.StandardCost,
                p.IsActive
            })
            .ToListAsync(cancellationToken);

        var inventory = await _farmDb.Inventory.AsNoTracking()
            .OrderByDescending(inv => inv.Id)
            .Take(limit)
            .Select(inv => new
            {
                inv.Id,
                inv.ProductId,
                inv.StorageLocation,
                inv.CurrentStock,
                inv.ReservedStock,
                inv.LastUpdated
            })
            .ToListAsync(cancellationToken);

        var expenses = await _expenseDb.ExpenseTransactions.AsNoTracking()
            .OrderByDescending(e => e.ExpenseDate)
            .ThenByDescending(e => e.Id)
            .Take(limit)
            .Select(e => new
            {
                e.Id,
                e.ExpenseNo,
                e.ExpenseDate,
                e.Farmer,
                e.Farm,
                e.Crop,
                e.ExpenseCategory,
                e.Supplier,
                e.Amount,
                e.PaymentMode,
                e.Status
            })
            .ToListAsync(cancellationToken);

        var sales = await _salesDb.Sales.AsNoTracking()
            .OrderByDescending(s => s.SalesDate)
            .ThenByDescending(s => s.Id)
            .Take(limit)
            .Select(s => new
            {
                s.Id,
                s.SalesNo,
                s.SalesDate,
                s.BuyerId,
                s.Buyer,
                s.Farm,
                s.Crop,
                s.Quantity,
                s.Unit,
                s.Rate,
                s.GrossAmount,
                s.Commission,
                s.Transport,
                s.NetAmount,
                s.PaymentStatus
            })
            .ToListAsync(cancellationToken);

        var buyers = await _salesDb.Buyers.AsNoTracking()
            .OrderBy(b => b.BuyerName)
            .Take(limit)
            .Select(b => new
            {
                b.Id,
                b.BuyerCode,
                b.BuyerName,
                b.Mobile,
                b.BusinessName,
                b.Gstin,
                b.OpeningBalance,
                b.Status
            })
            .ToListAsync(cancellationToken);

        var salesItems = await _salesDb.SalesItems.AsNoTracking()
            .OrderByDescending(i => i.Id)
            .Take(limit)
            .Select(i => new
            {
                i.Id,
                i.SaleId,
                i.SalesNo,
                i.Crop,
                i.Quantity,
                i.Unit,
                i.Rate,
                i.Amount
            })
            .ToListAsync(cancellationToken);

        var salesPayments = await _salesDb.SalesPayments.AsNoTracking()
            .OrderByDescending(p => p.PaymentDate)
            .ThenByDescending(p => p.Id)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.SaleId,
                p.PaymentNo,
                p.PaymentDate,
                p.Buyer,
                p.SalesNo,
                p.PaymentAmount,
                p.PaymentMode,
                p.ReferenceNo
            })
            .ToListAsync(cancellationToken);

        var machineries = await _machineryDb.Machineries.AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.MachineName,
                m.MachineType,
                m.RegistrationNo,
                m.PurchaseDate,
                m.PurchaseCost,
                m.CurrentValue,
                m.FuelType,
                m.Status,
                m.CreatedAt,
                ExpenseCount = m.Expenses.Count,
                TotalExpenses = m.Expenses.Sum(e => (decimal?)e.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);

        var machineryExpenses = await _machineryDb.MachineryExpenses.AsNoTracking()
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Id)
            .Take(limit)
            .Select(e => new
            {
                e.Id,
                e.MachineryId,
                e.MachineName,
                e.ExpenseType,
                e.Date,
                e.Amount,
                e.Operator,
                e.Remarks,
                e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var machineryExpenseTypes = await _machineryDb.MachineryExpenseTypes.AsNoTracking()
            .OrderBy(t => t.Id)
            .Select(t => new { t.Id, t.Code, t.Name, t.Description, t.IsActive })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            database = "Farmersdb",
            server = "NIRANJAN\\SQLEXPRESS",
            generatedAtUtc = DateTime.UtcNow,
            maxRowsPerModule = limit,
            summary,
            modules = new
            {
                auth = new { users, roles },
                farmers = new { items = farmers },
                farms = new { farms, landDetails },
                income = new { transactions = income },
                purchases = new { suppliers, orders = purchases },
                inventory = new { products, stock = inventory },
                expenses = new { transactions = expenses },
                sales = new { items = sales, buyers, salesItems, payments = salesPayments },
                machinery = new
                {
                    machines = machineries,
                    expenses = machineryExpenses,
                    expenseTypes = machineryExpenseTypes
                }
            }
        });
    }

    private async Task<object> BuildSummaryAsync(CancellationToken cancellationToken)
    {
        var usersCount = await _authDb.Users.CountAsync(cancellationToken);
        var rolesCount = await _authDb.Roles.CountAsync(cancellationToken);

        var farmersCount = await _farmDb.Farmers.CountAsync(cancellationToken);
        var farmsCount = await _farmDb.Farms.CountAsync(cancellationToken);
        var landDetailsCount = await _farmDb.FarmLandDetails.CountAsync(cancellationToken);
        var documentsCount = await _farmDb.FarmDocuments.CountAsync(cancellationToken);

        var incomeCount = await _farmDb.IncomeTransactions.CountAsync(cancellationToken);
        var totalIncomeNet = await _farmDb.IncomeTransactions.SumAsync(x => (decimal?)x.NetAmount, cancellationToken) ?? 0m;

        var suppliersCount = await _farmDb.Suppliers.CountAsync(cancellationToken);
        var purchasesCount = await _farmDb.Purchases.CountAsync(cancellationToken);
        var totalPurchaseAmount = await _farmDb.Purchases.SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0m;

        var productsCount = await _farmDb.Products.CountAsync(cancellationToken);
        var inventoryLocationsCount = await _farmDb.Inventory.CountAsync(cancellationToken);
        var totalCurrentStock = await _farmDb.Inventory.SumAsync(x => (decimal?)x.CurrentStock, cancellationToken) ?? 0m;

        var expenseCount = await _expenseDb.ExpenseTransactions.CountAsync(cancellationToken);
        var totalExpenseAmount = await _expenseDb.ExpenseTransactions.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;

        var salesCount = await _salesDb.Sales.CountAsync(cancellationToken);
        var totalSalesNet = await _salesDb.Sales.SumAsync(x => (decimal?)x.NetAmount, cancellationToken) ?? 0m;
        var buyersCount = await _salesDb.Buyers.CountAsync(cancellationToken);
        var salesItemsCount = await _salesDb.SalesItems.CountAsync(cancellationToken);
        var salesPaymentsCount = await _salesDb.SalesPayments.CountAsync(cancellationToken);
        var totalSalesCollected = await _salesDb.SalesPayments.SumAsync(x => (decimal?)x.PaymentAmount, cancellationToken) ?? 0m;

        var machineryCount = await _machineryDb.Machineries.CountAsync(cancellationToken);
        var totalMachineryPurchaseCost = await _machineryDb.Machineries.SumAsync(x => (decimal?)x.PurchaseCost, cancellationToken) ?? 0m;
        var totalMachineryCurrentValue = await _machineryDb.Machineries.SumAsync(x => (decimal?)x.CurrentValue, cancellationToken) ?? 0m;
        var machineryExpenseCount = await _machineryDb.MachineryExpenses.CountAsync(cancellationToken);
        var totalMachineryExpenseAmount = await _machineryDb.MachineryExpenses.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;

        return new
        {
            auth = new { usersCount, rolesCount },
            farmers = new { farmersCount },
            farms = new { farmsCount, landDetailsCount, documentsCount },
            income = new { transactionCount = incomeCount, totalNetAmount = totalIncomeNet },
            purchases = new { suppliersCount, purchaseCount = purchasesCount, totalAmount = totalPurchaseAmount },
            inventory = new { productsCount, inventoryLocationsCount, totalCurrentStock },
            expenses = new { transactionCount = expenseCount, totalAmount = totalExpenseAmount },
            sales = new
            {
                saleCount = salesCount,
                totalNetAmount = totalSalesNet,
                buyersCount,
                salesItemsCount,
                paymentsCount = salesPaymentsCount,
                totalCollectedAmount = totalSalesCollected
            },
            machinery = new
            {
                totalMachines = machineryCount,
                totalPurchaseCost = totalMachineryPurchaseCost,
                totalCurrentValue = totalMachineryCurrentValue,
                totalExpenseRecords = machineryExpenseCount,
                totalExpenseAmount = totalMachineryExpenseAmount
            }
        };
    }
}
