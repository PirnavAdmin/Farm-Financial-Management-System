using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;
using FarmManagementApi.DTOs;

namespace FarmManagementApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryController : ControllerBase
{
    private readonly FarmDbContext _context;

    public InventoryController(FarmDbContext context)
    {
        _context = context;
    }

    // 1. SCREEN: Stock In
    [HttpPost("stock-in")]
    public async Task<IActionResult> StockIn([FromBody] StockInDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation == dto.StorageLocation);

        if (inv == null)
        {
            inv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = dto.StorageLocation,
                CurrentStock = dto.Quantity,
                LastUpdated = DateTime.UtcNow
            };
            _context.Inventory.Add(inv);
        }
        else
        {
            inv.CurrentStock += dto.Quantity;
            inv.LastUpdated = DateTime.UtcNow;
        }

        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "StockIn",
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            StorageLocation = dto.StorageLocation,
            ReferenceType = dto.ReferenceType,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            BalanceAfterTransaction = inv.CurrentStock
        };

        _context.InventoryTransactions.Add(log);
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { Message = "Stock added successfully", inv.CurrentStock });
    }

    // 2. SCREEN: Stock Out
    [HttpPost("stock-out")]
    public async Task<IActionResult> StockOut([FromBody] StockOutDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation == dto.StorageLocation);

        if (inv == null || inv.CurrentStock < dto.Quantity)
            return BadRequest($"Insufficient stock in {dto.StorageLocation}. Available: {inv?.CurrentStock ?? 0}");

        inv.CurrentStock -= dto.Quantity;
        inv.LastUpdated = DateTime.UtcNow;

        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "StockOut",
            Quantity = -dto.Quantity,
            UnitPrice = 0,
            StorageLocation = dto.StorageLocation,
            ReferenceType = dto.ReferenceType,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            BalanceAfterTransaction = inv.CurrentStock
        };

        _context.InventoryTransactions.Add(log);
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { Message = "Stock deducted successfully", inv.CurrentStock });
    }

    // 3. SCREEN: Stock Transfer
    [HttpPost("stock-transfer")]
    public async Task<IActionResult> StockTransfer([FromBody] StockTransferDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");
        if (dto.FromLocation == dto.ToLocation) return BadRequest("Source and target locations must be different.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var fromInv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation == dto.FromLocation);

        if (fromInv == null || fromInv.CurrentStock < dto.Quantity)
            return BadRequest($"Insufficient stock at {dto.FromLocation}. Available: {fromInv?.CurrentStock ?? 0}");

        var toInv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation == dto.ToLocation);

        if (toInv == null)
        {
            toInv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = dto.ToLocation,
                CurrentStock = dto.Quantity,
                LastUpdated = DateTime.UtcNow
            };
            _context.Inventory.Add(toInv);
        }
        else
        {
            toInv.CurrentStock += dto.Quantity;
            toInv.LastUpdated = DateTime.UtcNow;
        }

        fromInv.CurrentStock -= dto.Quantity;
        fromInv.LastUpdated = DateTime.UtcNow;

        var transferBatch = Guid.NewGuid().ToString("N")[..8].ToUpper();

        _context.InventoryTransactions.AddRange(
            new InventoryTransaction
            {
                ProductId = dto.ProductId,
                TransactionDate = DateTime.UtcNow,
                TransactionType = "TransferOut",
                Quantity = -dto.Quantity,
                StorageLocation = dto.FromLocation,
                ReferenceType = "StockTransfer",
                ReferenceNumber = $"TRF-{transferBatch}",
                Notes = $"Transferred to {dto.ToLocation}. {dto.Notes}",
                BalanceAfterTransaction = fromInv.CurrentStock
            },
            new InventoryTransaction
            {
                ProductId = dto.ProductId,
                TransactionDate = DateTime.UtcNow,
                TransactionType = "TransferIn",
                Quantity = dto.Quantity,
                StorageLocation = dto.ToLocation,
                ReferenceType = "StockTransfer",
                ReferenceNumber = $"TRF-{transferBatch}",
                Notes = $"Transferred from {dto.FromLocation}. {dto.Notes}",
                BalanceAfterTransaction = toInv.CurrentStock
            }
        );

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { Message = "Transfer completed successfully", FromStock = fromInv.CurrentStock, ToStock = toInv.CurrentStock });
    }

    // 4. SCREEN: Stock Adjustment
    [HttpPost("stock-adjustment")]
    public async Task<IActionResult> StockAdjustment([FromBody] CreateStockAdjustmentDto dto)
    {
        if (dto.PhysicalStock < 0) return BadRequest("Physical stock cannot be negative.");

        using var tx = await _context.Database.BeginTransactionAsync();

        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation == dto.StorageLocation);

        decimal bookStock = inv?.CurrentStock ?? 0;
        decimal diff = dto.PhysicalStock - bookStock;

        if (inv == null)
        {
            inv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = dto.StorageLocation,
                CurrentStock = dto.PhysicalStock,
                LastUpdated = DateTime.UtcNow
            };
            _context.Inventory.Add(inv);
        }
        else
        {
            inv.CurrentStock = dto.PhysicalStock;
            inv.LastUpdated = DateTime.UtcNow;
        }

        var adjNumber = $"ADJ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";

        var adjustment = new StockAdjustment
        {
            AdjustmentNumber = adjNumber,
            AdjustmentDate = DateTime.UtcNow,
            ProductId = dto.ProductId,
            StorageLocation = dto.StorageLocation,
            BookStock = bookStock,
            PhysicalStock = dto.PhysicalStock,
            Reason = dto.Reason,
            Remarks = dto.Remarks
        };
        _context.StockAdjustments.Add(adjustment);

        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "Adjustment",
            Quantity = diff,
            StorageLocation = dto.StorageLocation,
            ReferenceType = "StockAdjustment",
            ReferenceNumber = adjNumber,
            Notes = $"Physical count adjustment: {dto.Reason}",
            BalanceAfterTransaction = dto.PhysicalStock
        };
        _context.InventoryTransactions.Add(log);

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { Message = "Stock adjusted successfully", AdjustmentNumber = adjNumber, Variance = diff });
    }

    // 5. SCREEN: Stock Ledger
    [HttpGet("ledger")]
    public async Task<IActionResult> GetLedger(
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Product)
            .ThenInclude(p => p!.Units)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(t => t.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(t => t.StorageLocation == location);

        if (fromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.TransactionDate <= toDate.Value);

        var ledger = await query
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new
            {
                t.Id,
                t.TransactionDate,
                t.ProductId,
                ProductName = t.Product != null ? t.Product.Name : "",
                ProductCode = t.Product != null ? t.Product.Code : "",
                Unit = t.Product != null && t.Product.Units != null ? t.Product.Units.ShortCode : "",
                t.TransactionType,
                t.Quantity,
                t.StorageLocation,
                t.ReferenceType,
                t.ReferenceNumber,
                t.BalanceAfterTransaction,
                t.Notes
            })
            .ToListAsync();

        return Ok(ledger);
    }

    // 6. SCREEN: Low Stock
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var lowStockList = await _context.Inventory
            .Include(i => i.Product)
            .ThenInclude(p => p!.Units)
            .Include(i => i.Product!.Category)
            .Where(i => i.Product != null && i.Product.IsActive && i.CurrentStock <= i.Product.ReorderLevel)
            .Select(i => new
            {
                i.ProductId,
                ProductName = i.Product!.Name,
                ProductCode = i.Product.Code,
                Category = i.Product.Category != null ? i.Product.Category.Name : "",
                Unit = i.Product.Units != null ? i.Product.Units.ShortCode : "",
                i.StorageLocation,
                i.CurrentStock,
                i.Product.ReorderLevel,
                Deficit = i.Product.ReorderLevel - i.CurrentStock
            })
            .ToListAsync();

        return Ok(lowStockList);
    }
}