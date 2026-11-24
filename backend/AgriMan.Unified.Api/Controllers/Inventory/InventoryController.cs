using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;
using FarmManagementApi.DTOs;
using AgriMan.Api.Services;

namespace FarmManagementApi.Controllers;

/// <summary>
/// Inventory Movements Engine & Stock Operations Controller.
/// Implements Part 2: Live Stock Directory, Stock In, Stock Out, and Inter-location Transfers.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Produces("application/json")]
public class InventoryController : ControllerBase
{
    private readonly FarmDbContext _context;
    private readonly IAuditService _auditService;

    public InventoryController(FarmDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    // =========================================================================
    // 1. LIVE STOCK DIRECTORY (Part 2 - Kalyan kumar vanumu)
    // =========================================================================

    /// <summary>
    /// Lists current stock per product and storage location with search, categoryId, location, and pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedStockDirectoryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLiveStockDirectory(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] string? location,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Inventory
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .Include(i => i.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(i =>
                (i.Product != null && i.Product.Name.ToLower().Contains(term)) ||
                (i.Product != null && i.Product.Code.ToLower().Contains(term)) ||
                i.StorageLocation.ToLower().Contains(term));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(i => i.Product != null && i.Product.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(i => i.StorageLocation.ToLower() == loc);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(i => i.Product != null ? i.Product.Name : "")
            .ThenBy(i => i.StorageLocation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new StockDirectoryItemDto
            {
                InventoryId = i.Id,
                ProductId = i.ProductId,
                ProductCode = i.Product != null ? i.Product.Code : string.Empty,
                ProductName = i.Product != null ? i.Product.Name : string.Empty,
                CategoryId = i.Product != null ? i.Product.CategoryId : 0,
                CategoryName = i.Product != null && i.Product.Category != null ? i.Product.Category.Name : string.Empty,
                StorageLocation = i.StorageLocation,
                CurrentStock = i.CurrentStock,
                ReservedStock = i.ReservedStock,
                Unit = i.Product != null && i.Product.Units != null ? i.Product.Units.ShortCode : "Kg",
                StandardCost = i.Product != null ? i.Product.StandardCost : 0,
                ReorderLevel = i.Product != null ? i.Product.ReorderLevel : 0,
                LastUpdated = i.LastUpdated
            })
            .ToListAsync();

        return Ok(new PaginatedStockDirectoryResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Retrieves the stock breakdown across all physical storage locations for a specific product.
    /// </summary>
    [HttpGet("{productId:int}/stock")]
    [ProducesResponseType(typeof(ProductStockBreakdownDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductStockBreakdown(int productId)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = $"Product with ID {productId} does not exist." });
        }

        var locations = await _context.Inventory
            .Where(i => i.ProductId == productId)
            .OrderBy(i => i.StorageLocation)
            .Select(i => new LocationStockBreakdownDto
            {
                StorageLocation = i.StorageLocation,
                CurrentStock = i.CurrentStock,
                ReservedStock = i.ReservedStock,
                UnitPrice = product.StandardCost,
                LastUpdated = i.LastUpdated
            })
            .ToListAsync();

        var totalStock = locations.Sum(l => l.CurrentStock);
        var totalValue = locations.Sum(l => l.TotalValue);

        return Ok(new ProductStockBreakdownDto
        {
            ProductId = product.Id,
            ProductCode = product.Code,
            ProductName = product.Name,
            CategoryName = product.Category?.Name ?? string.Empty,
            Unit = product.Units?.ShortCode ?? string.Empty,
            ReorderLevel = product.ReorderLevel,
            TotalStockAllLocations = totalStock,
            TotalValueAllLocations = totalValue,
            Locations = locations
        });
    }

    // =========================================================================
    // 2. STOCK IN (Part 2 - Kalyan kumar vanumu)
    // =========================================================================

    /// <summary>
    /// Retrieves historical Stock In transactions with filtering by date, product, location, and supplier.
    /// </summary>
    [HttpGet("stock-in")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockInHistory(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] int? supplierId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.InventoryTransactions
            .Include(t => t.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(t => t.TransactionType == "StockIn")
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(t => t.TransactionDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(t => t.TransactionDate <= toDate.Value);
        if (productId.HasValue) query = query.Where(t => t.ProductId == productId.Value);
        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(t => t.StorageLocation.ToLower() == location.Trim().ToLower());
        if (supplierId.HasValue)
            query = query.Where(t => t.Notes != null && t.Notes.Contains($"SupplierId:{supplierId.Value}"));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                TransactionNo = t.ReferenceNumber,
                t.TransactionDate,
                t.ProductId,
                ProductName = t.Product != null ? t.Product.Name : "",
                ProductCode = t.Product != null ? t.Product.Code : "",
                Unit = t.Product != null && t.Product.Units != null ? t.Product.Units.ShortCode : "",
                t.Quantity,
                t.UnitPrice,
                TotalValue = Math.Round(t.Quantity * t.UnitPrice, 2),
                t.StorageLocation,
                t.ReferenceType,
                t.ReferenceNumber,
                t.BalanceAfterTransaction,
                t.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Receives goods into inventory, validates ProductId, updates stock balance, and auto-generates SIN-YYYY-NNN.
    /// </summary>
    [HttpPost("stock-in")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StockIn([FromBody] StockInDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest(new { error = "INVALID_QUANTITY", message = "Quantity must be greater than zero." });

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = $"Product with ID {dto.ProductId} was not found." });
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var normalizedLoc = string.IsNullOrWhiteSpace(dto.StorageLocation) ? "Main Warehouse" : dto.StorageLocation.Trim();
        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation.ToLower() == normalizedLoc.ToLower());

        if (inv == null)
        {
            inv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = normalizedLoc,
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

        // Auto-generate TransactionNo: SIN-YYYY-NNN
        var year = DateTime.UtcNow.Year;
        var prefix = $"SIN-{year}-";
        var countThisYear = await _context.InventoryTransactions
            .CountAsync(t => t.TransactionType == "StockIn" && t.TransactionDate.Year == year);
        var transactionNo = $"{prefix}{(countThisYear + 1):D3}";

        var unitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : product.StandardCost;
        var metadataParts = new List<string>();
        if (dto.SupplierId.HasValue) metadataParts.Add($"SupplierId:{dto.SupplierId.Value}");
        if (!string.IsNullOrWhiteSpace(dto.SupplierName)) metadataParts.Add($"Supplier:{dto.SupplierName}");
        if (!string.IsNullOrWhiteSpace(dto.Notes)) metadataParts.Add(dto.Notes);

        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "StockIn",
            Quantity = dto.Quantity,
            UnitPrice = unitPrice,
            StorageLocation = normalizedLoc,
            ReferenceType = dto.ReferenceType ?? "Purchase",
            ReferenceNumber = transactionNo,
            Notes = metadataParts.Count > 0 ? string.Join(" | ", metadataParts) : "Standard Stock In",
            BalanceAfterTransaction = inv.CurrentStock
        };

        _context.InventoryTransactions.Add(log);
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var actor = _auditService.GetActorFromPrincipal(User);
        await _auditService.LogActionAsync(
            actor.ActorUserId,
            actor.ActorName,
            "StockIn",
            "Inventory",
            transactionNo,
            $"Received {dto.Quantity} of '{product.Name}' into '{normalizedLoc}'. TransactionNo: {transactionNo}");

        return Ok(new
        {
            message = "Stock added successfully",
            transactionNo,
            productId = dto.ProductId,
            productName = product.Name,
            quantity = dto.Quantity,
            currentStock = inv.CurrentStock
        });
    }

    // =========================================================================
    // 3. STOCK OUT (Part 2 - Kalyan kumar vanumu)
    // =========================================================================

    /// <summary>
    /// Retrieves historical Stock Out transactions with filtering by date, product, location, and farm/crop.
    /// </summary>
    [HttpGet("stock-out")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockOutHistory(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] int? farmId,
        [FromQuery] int? cropId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.InventoryTransactions
            .Include(t => t.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(t => t.TransactionType == "StockOut")
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(t => t.TransactionDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(t => t.TransactionDate <= toDate.Value);
        if (productId.HasValue) query = query.Where(t => t.ProductId == productId.Value);
        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(t => t.StorageLocation.ToLower() == location.Trim().ToLower());
        if (farmId.HasValue)
            query = query.Where(t => t.Notes != null && t.Notes.Contains($"FarmId:{farmId.Value}"));
        if (cropId.HasValue)
            query = query.Where(t => t.Notes != null && t.Notes.Contains($"CropId:{cropId.Value}"));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                TransactionNo = t.ReferenceNumber,
                t.TransactionDate,
                t.ProductId,
                ProductName = t.Product != null ? t.Product.Name : "",
                ProductCode = t.Product != null ? t.Product.Code : "",
                Unit = t.Product != null && t.Product.Units != null ? t.Product.Units.ShortCode : "",
                Quantity = Math.Abs(t.Quantity),
                t.StorageLocation,
                t.ReferenceType,
                t.ReferenceNumber,
                t.BalanceAfterTransaction,
                t.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Issues goods out of inventory with strict insufficient-stock validation and auto-generates SOUT-YYYY-NNN.
    /// </summary>
    [HttpPost("stock-out")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StockOut([FromBody] StockOutDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest(new { error = "INVALID_QUANTITY", message = "Quantity must be greater than zero." });

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = $"Product with ID {dto.ProductId} was not found." });
        }

        var normalizedLoc = string.IsNullOrWhiteSpace(dto.StorageLocation) ? "Main Warehouse" : dto.StorageLocation.Trim();
        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation.ToLower() == normalizedLoc.ToLower());

        // Strict Insufficient-stock validation
        if (inv == null || inv.CurrentStock < dto.Quantity)
        {
            var available = inv?.CurrentStock ?? 0;
            return BadRequest(new
            {
                error = "INSUFFICIENT_STOCK",
                message = $"Insufficient stock for '{product.Name}' in '{normalizedLoc}'. Available: {available}, Requested: {dto.Quantity}"
            });
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var previousStock = inv.CurrentStock;
        inv.CurrentStock -= dto.Quantity;
        inv.LastUpdated = DateTime.UtcNow;

        // Auto-generate TransactionNo: SOUT-YYYY-NNN
        var year = DateTime.UtcNow.Year;
        var prefix = $"SOUT-{year}-";
        var countThisYear = await _context.InventoryTransactions
            .CountAsync(t => t.TransactionType == "StockOut" && t.TransactionDate.Year == year);
        var transactionNo = $"{prefix}{(countThisYear + 1):D3}";

        var metadataParts = new List<string>();
        if (dto.FarmId.HasValue) metadataParts.Add($"FarmId:{dto.FarmId.Value}");
        if (dto.CropId.HasValue) metadataParts.Add($"CropId:{dto.CropId.Value}");
        if (!string.IsNullOrWhiteSpace(dto.IssuedTo)) metadataParts.Add($"IssuedTo:{dto.IssuedTo}");
        if (!string.IsNullOrWhiteSpace(dto.Purpose)) metadataParts.Add($"Purpose:{dto.Purpose}");
        if (!string.IsNullOrWhiteSpace(dto.Notes)) metadataParts.Add(dto.Notes);

        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "StockOut",
            Quantity = -dto.Quantity,
            UnitPrice = product.StandardCost,
            StorageLocation = normalizedLoc,
            ReferenceType = dto.ReferenceType ?? "FieldUsage",
            ReferenceNumber = transactionNo,
            Notes = metadataParts.Count > 0 ? string.Join(" | ", metadataParts) : "Standard Stock Out",
            BalanceAfterTransaction = inv.CurrentStock
        };

        _context.InventoryTransactions.Add(log);
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var actor = _auditService.GetActorFromPrincipal(User);
        await _auditService.LogActionAsync(
            actor.ActorUserId,
            actor.ActorName,
            "StockOut",
            "Inventory",
            transactionNo,
            $"Issued {dto.Quantity} of '{product.Name}' from '{normalizedLoc}'. Previous: {previousStock}, Remaining: {inv.CurrentStock}");

        return Ok(new
        {
            message = "Stock deducted successfully",
            transactionNo,
            productId = dto.ProductId,
            productName = product.Name,
            quantity = dto.Quantity,
            currentStock = inv.CurrentStock
        });
    }

    // =========================================================================
    // 4. STOCK TRANSFER (Part 2 - Kalyan kumar vanumu)
    // =========================================================================

    /// <summary>
    /// Retrieves historical inter-warehouse/location stock transfer transactions.
    /// </summary>
    [HttpGet("stock-transfer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockTransferHistory(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? productId,
        [FromQuery] string? fromLocation,
        [FromQuery] string? toLocation,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.InventoryTransactions
            .Include(t => t.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .Where(t => t.TransactionType == "TransferOut" || t.TransactionType == "TransferIn")
            .AsQueryable();

        if (fromDate.HasValue) query = query.Where(t => t.TransactionDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(t => t.TransactionDate <= toDate.Value);
        if (productId.HasValue) query = query.Where(t => t.ProductId == productId.Value);
        if (!string.IsNullOrWhiteSpace(fromLocation))
            query = query.Where(t => t.StorageLocation.ToLower() == fromLocation.Trim().ToLower() || (t.Notes != null && t.Notes.Contains($"From:{fromLocation.Trim()}")));
        if (!string.IsNullOrWhiteSpace(toLocation))
            query = query.Where(t => t.StorageLocation.ToLower() == toLocation.Trim().ToLower() || (t.Notes != null && t.Notes.Contains($"To:{toLocation.Trim()}")));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.TransactionDate,
                t.TransactionType,
                t.ProductId,
                ProductName = t.Product != null ? t.Product.Name : "",
                ProductCode = t.Product != null ? t.Product.Code : "",
                Quantity = Math.Abs(t.Quantity),
                t.StorageLocation,
                t.ReferenceNumber,
                t.BalanceAfterTransaction,
                t.Notes
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    /// <summary>
    /// Executes an atomic stock transfer between two locations with paired TransferOut and TransferIn ledger entries.
    /// </summary>
    [HttpPost("stock-transfer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StockTransfer([FromBody] StockTransferDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest(new { error = "INVALID_QUANTITY", message = "Quantity must be greater than zero." });

        var fromLoc = dto.FromLocation?.Trim() ?? "";
        var toLoc = dto.ToLocation?.Trim() ?? "";

        if (string.Equals(fromLoc, toLoc, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "INVALID_LOCATIONS", message = "Source and target locations must be different." });

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = $"Product with ID {dto.ProductId} was not found." });
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var fromInv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation.ToLower() == fromLoc.ToLower());

        if (fromInv == null || fromInv.CurrentStock < dto.Quantity)
            return BadRequest(new
            {
                error = "INSUFFICIENT_SOURCE_STOCK",
                message = $"Insufficient stock for '{product.Name}' at {fromLoc}. Available: {fromInv?.CurrentStock ?? 0}, Requested: {dto.Quantity}"
            });

        var toInv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation.ToLower() == toLoc.ToLower());

        if (toInv == null)
        {
            toInv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = toLoc,
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

        var year = DateTime.UtcNow.Year;
        var prefix = $"STR-{year}-";
        var countThisYear = await _context.InventoryTransactions
            .CountAsync(t => (t.TransactionType == "TransferOut" || t.TransactionType == "TransferIn") && t.TransactionDate.Year == year);
        var baseSequence = $"{prefix}{(countThisYear / 2 + 1):D3}";

        var transferOutNumber = $"{baseSequence}-OUT";
        var transferInNumber = $"{baseSequence}-IN";

        // Paired Ledger Entry 1: TransferOut
        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferOut",
            Quantity = -dto.Quantity,
            UnitPrice = product.StandardCost,
            StorageLocation = fromLoc,
            ReferenceType = "Transfer",
            ReferenceNumber = transferOutNumber,
            Notes = $"To:{toLoc} | {dto.Notes}".Trim(),
            BalanceAfterTransaction = fromInv.CurrentStock
        });

        // Paired Ledger Entry 2: TransferIn
        _context.InventoryTransactions.Add(new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferIn",
            Quantity = dto.Quantity,
            UnitPrice = product.StandardCost,
            StorageLocation = toLoc,
            ReferenceType = "Transfer",
            ReferenceNumber = transferInNumber,
            Notes = $"From:{fromLoc} | {dto.Notes}".Trim(),
            BalanceAfterTransaction = toInv.CurrentStock
        });

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var actor = _auditService.GetActorFromPrincipal(User);
        await _auditService.LogActionAsync(
            actor.ActorUserId,
            actor.ActorName,
            "StockTransfer",
            "Inventory",
            baseSequence,
            $"Transferred {dto.Quantity} of '{product.Name}' from '{fromLoc}' to '{toLoc}'");

        return Ok(new
        {
            message = "Transfer completed successfully",
            transferOutNumber,
            transferInNumber,
            fromStock = fromInv.CurrentStock,
            toStock = toInv.CurrentStock
        });
    }

    // =========================================================================
    // 5. EXISTING STOCK OPERATIONS (Adjustments, Ledger, Low Stock)
    // =========================================================================

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
