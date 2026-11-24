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
    // 5. PART 3: STOCK ADJUSTMENTS, LEDGER, LOW STOCK & ANALYTICS (Chandana Paparao)
    // =========================================================================

    /// <summary>
    /// Retrieves paginated stock adjustment history with optional filters (productId, location, fromDate, toDate).
    /// </summary>
    [HttpGet("stock-adjustment")]
    [ProducesResponseType(typeof(PaginatedStockAdjustmentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockAdjustmentHistory(
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.StockAdjustments
            .Include(sa => sa.Product)
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(sa => sa.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(sa => sa.StorageLocation.ToLower().Contains(loc));
        }

        if (fromDate.HasValue)
        {
            query = query.Where(sa => sa.AdjustmentDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            var endOfDay = toDate.Value.TimeOfDay == TimeSpan.Zero
                ? toDate.Value.Date.AddDays(1).AddTicks(-1)
                : toDate.Value;
            query = query.Where(sa => sa.AdjustmentDate <= endOfDay);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(sa => sa.AdjustmentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(sa => new StockAdjustmentHistoryDto
            {
                Id = sa.Id,
                AdjustmentNumber = sa.AdjustmentNumber,
                ProductId = sa.ProductId,
                ProductCode = sa.Product != null ? sa.Product.Code : string.Empty,
                ProductName = sa.Product != null ? sa.Product.Name : string.Empty,
                StorageLocation = sa.StorageLocation,
                BookStock = sa.BookStock,
                PhysicalStock = sa.PhysicalStock,
                DifferenceQty = sa.PhysicalStock - sa.BookStock,
                AdjustmentType = sa.AdjustmentType ?? (sa.PhysicalStock > sa.BookStock ? "Increase" : (sa.PhysicalStock < sa.BookStock ? "Decrease" : "Reconciliation")),
                Reason = sa.Reason,
                ApprovedBy = sa.ApprovedBy,
                Remarks = sa.Remarks,
                AdjustmentDate = sa.AdjustmentDate
            })
            .ToListAsync();

        return Ok(new PaginatedStockAdjustmentsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Records physical inventory count reconciliation with product validation, automatic adjustment type computation, and atomic ledger sync.
    /// </summary>
    [HttpPost("stock-adjustment")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StockAdjustment([FromBody] CreateStockAdjustmentDto dto)
    {
        if (dto.PhysicalStock < 0)
        {
            return BadRequest(new { error = "INVALID_PHYSICAL_STOCK", message = "Physical stock cannot be negative." });
        }

        // 1. Product existence validation
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return NotFound(new { error = "PRODUCT_NOT_FOUND", message = $"Product with ID {dto.ProductId} was not found." });
        }

        var normalizedLoc = string.IsNullOrWhiteSpace(dto.StorageLocation) ? "Main Warehouse" : dto.StorageLocation.Trim();
        var approver = !string.IsNullOrWhiteSpace(dto.ApprovedBy)
            ? dto.ApprovedBy.Trim()
            : _auditService.GetActorFromPrincipal(User).ActorName;

        if (string.IsNullOrWhiteSpace(approver))
        {
            approver = "Chandana Paparao (Warehouse Manager)";
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        // 2. Fetch or initialize inventory record
        var inv = await _context.Inventory
            .FirstOrDefaultAsync(i => i.ProductId == dto.ProductId && i.StorageLocation.ToLower() == normalizedLoc.ToLower());

        decimal bookStock = inv?.CurrentStock ?? 0;
        decimal diff = dto.PhysicalStock - bookStock;

        // 3. Computed AdjustmentType
        string adjustmentType;
        if (diff > 0)
        {
            adjustmentType = "Increase";
        }
        else if (diff < 0)
        {
            adjustmentType = "Decrease";
        }
        else
        {
            adjustmentType = "Reconciliation (No Change)";
        }

        if (inv == null)
        {
            inv = new Inventory
            {
                ProductId = dto.ProductId,
                StorageLocation = normalizedLoc,
                CurrentStock = dto.PhysicalStock,
                ReservedStock = 0,
                LastUpdated = DateTime.UtcNow
            };
            _context.Inventory.Add(inv);
        }
        else
        {
            inv.CurrentStock = dto.PhysicalStock;
            inv.LastUpdated = DateTime.UtcNow;
        }

        // 4. Generate unique adjustment number: ADJ-YYYY-NNNN
        var year = DateTime.UtcNow.Year;
        var prefix = $"ADJ-{year}-";
        var countThisYear = await _context.StockAdjustments
            .CountAsync(sa => sa.AdjustmentDate.Year == year);
        var adjNumber = $"{prefix}{(countThisYear + 1):D4}";

        var adjustment = new StockAdjustment
        {
            AdjustmentNumber = adjNumber,
            AdjustmentDate = DateTime.UtcNow,
            ProductId = dto.ProductId,
            StorageLocation = normalizedLoc,
            BookStock = bookStock,
            PhysicalStock = dto.PhysicalStock,
            Reason = dto.Reason,
            Remarks = dto.Remarks,
            AdjustmentType = adjustmentType,
            ApprovedBy = approver
        };
        _context.StockAdjustments.Add(adjustment);

        // 5. Atomic sync into InventoryTransaction ledger
        var log = new InventoryTransaction
        {
            ProductId = dto.ProductId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "Adjustment",
            Quantity = diff,
            UnitPrice = product.StandardCost,
            StorageLocation = normalizedLoc,
            ReferenceType = "StockAdjustment",
            ReferenceNumber = adjNumber,
            Notes = $"Adjustment ({adjustmentType}): Diff {diff:+0.00;-0.00;0.00}. Approved by: {approver}. Reason: {dto.Reason}",
            BalanceAfterTransaction = dto.PhysicalStock
        };
        _context.InventoryTransactions.Add(log);

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        // 6. Audit Logging
        var actor = _auditService.GetActorFromPrincipal(User);
        await _auditService.LogActionAsync(
            actor.ActorUserId,
            approver,
            "StockAdjustment",
            "Inventory",
            adjNumber,
            $"Adjusted '{product.Name}' at '{normalizedLoc}' from {bookStock} to {dto.PhysicalStock} ({adjustmentType}, diff: {diff})");

        return Ok(new
        {
            message = "Stock adjusted successfully",
            adjustmentNumber = adjNumber,
            productId = dto.ProductId,
            productName = product.Name,
            storageLocation = normalizedLoc,
            bookStock,
            physicalStock = dto.PhysicalStock,
            difference = diff,
            adjustmentType,
            approvedBy = approver
        });
    }

    /// <summary>
    /// Upgraded stock ledger endpoint with transactionType filter, keyword search, pagination, and full reference metadata.
    /// </summary>
    [HttpGet("ledger")]
    [ProducesResponseType(typeof(PaginatedStockLedgerResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLedger(
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] string? transactionType,
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.InventoryTransactions
            .Include(t => t.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue && productId.Value > 0)
            query = query.Where(t => t.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(t => t.StorageLocation.ToLower().Contains(loc));
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            var tt = transactionType.Trim().ToLower();
            query = query.Where(t => t.TransactionType.ToLower() == tt ||
                                     t.TransactionType.ToLower().Replace(" ", "") == tt);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t =>
                (t.Product != null && t.Product.Name.ToLower().Contains(term)) ||
                (t.Product != null && t.Product.Code.ToLower().Contains(term)) ||
                (t.ReferenceNumber != null && t.ReferenceNumber.ToLower().Contains(term)) ||
                (t.Notes != null && t.Notes.ToLower().Contains(term)));
        }

        if (fromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= fromDate.Value);

        if (toDate.HasValue)
        {
            var endOfDay = toDate.Value.TimeOfDay == TimeSpan.Zero
                ? toDate.Value.Date.AddDays(1).AddTicks(-1)
                : toDate.Value;
            query = query.Where(t => t.TransactionDate <= endOfDay);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new StockLedgerItemDto
            {
                Id = t.Id,
                TransactionDate = t.TransactionDate,
                ProductId = t.ProductId,
                ProductCode = t.Product != null ? t.Product.Code : string.Empty,
                ProductName = t.Product != null ? t.Product.Name : string.Empty,
                Unit = t.Product != null && t.Product.Units != null ? t.Product.Units.ShortCode : "Kg",
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                UnitPrice = t.UnitPrice,
                StorageLocation = t.StorageLocation,
                ReferenceType = t.ReferenceType,
                ReferenceNumber = t.ReferenceNumber,
                BalanceAfterTransaction = t.BalanceAfterTransaction,
                Notes = t.Notes
            })
            .ToListAsync();

        return Ok(new PaginatedStockLedgerResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Exports the filtered stock ledger as a formatted CSV spreadsheet.
    /// </summary>
    [HttpGet("ledger/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportStockLedgerCsv(
        [FromQuery] int? productId,
        [FromQuery] string? location,
        [FromQuery] string? transactionType,
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Product)
                .ThenInclude(p => p!.Units)
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue && productId.Value > 0)
            query = query.Where(t => t.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(t => t.StorageLocation.ToLower().Contains(loc));
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            var tt = transactionType.Trim().ToLower();
            query = query.Where(t => t.TransactionType.ToLower() == tt ||
                                     t.TransactionType.ToLower().Replace(" ", "") == tt);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t =>
                (t.Product != null && t.Product.Name.ToLower().Contains(term)) ||
                (t.Product != null && t.Product.Code.ToLower().Contains(term)) ||
                (t.ReferenceNumber != null && t.ReferenceNumber.ToLower().Contains(term)) ||
                (t.Notes != null && t.Notes.ToLower().Contains(term)));
        }

        if (fromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= fromDate.Value);

        if (toDate.HasValue)
        {
            var endOfDay = toDate.Value.TimeOfDay == TimeSpan.Zero
                ? toDate.Value.Date.AddDays(1).AddTicks(-1)
                : toDate.Value;
            query = query.Where(t => t.TransactionDate <= endOfDay);
        }

        var records = await query
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync();

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("ID,Transaction Date,Product Code,Product Name,Transaction Type,Quantity,Unit,Unit Price,Total Cost,Balance After,Storage Location,Reference Type,Reference Number,Notes");

        foreach (var r in records)
        {
            var prodCode = EscapeCsv(r.Product?.Code ?? string.Empty);
            var prodName = EscapeCsv(r.Product?.Name ?? string.Empty);
            var unit = EscapeCsv(r.Product?.Units?.ShortCode ?? string.Empty);
            var transType = EscapeCsv(r.TransactionType);
            var locationStr = EscapeCsv(r.StorageLocation);
            var refType = EscapeCsv(r.ReferenceType ?? string.Empty);
            var refNum = EscapeCsv(r.ReferenceNumber ?? string.Empty);
            var notes = EscapeCsv(r.Notes ?? string.Empty);
            var totalCost = Math.Abs(r.Quantity) * r.UnitPrice;

            sb.AppendLine($"{r.Id},{r.TransactionDate:yyyy-MM-dd HH:mm:ss},{prodCode},{prodName},{transType},{r.Quantity},{unit},{r.UnitPrice:F2},{totalCost:F2},{r.BalanceAfterTransaction},{locationStr},{refType},{refNum},{notes}");
        }

        var utf8Encoding = new System.Text.UTF8Encoding(true);
        var bytes = utf8Encoding.GetBytes(sb.ToString());
        var fileName = $"stock_ledger_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Retrieves low stock alerts with location/categoryId filters and calculated deficit and estimated reorder costs.
    /// </summary>
    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(List<LowStockAlertDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStock(
        [FromQuery] string? location,
        [FromQuery] int? categoryId)
    {
        var query = _context.Inventory
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .Include(i => i.Product)
                .ThenInclude(p => p!.Units)
            .Where(i => i.Product != null && i.Product.IsActive && i.CurrentStock <= i.Product.ReorderLevel)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(i => i.StorageLocation.ToLower().Contains(loc));
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(i => i.Product != null && i.Product.CategoryId == categoryId.Value);
        }

        var lowStockList = await query.ToListAsync();

        var alerts = lowStockList.Select(i =>
        {
            var deficit = Math.Max(0, i.Product!.ReorderLevel - i.CurrentStock);
            var estCost = deficit * i.Product.StandardCost;

            return new LowStockAlertDto
            {
                ProductId = i.ProductId,
                ProductCode = i.Product.Code,
                ProductName = i.Product.Name,
                CategoryName = i.Product.Category?.Name ?? "General",
                StorageLocation = i.StorageLocation,
                CurrentStock = i.CurrentStock,
                ReorderLevel = i.Product.ReorderLevel,
                StandardCost = i.Product.StandardCost,
                Unit = i.Product.Units?.ShortCode ?? "Kg"
            };
        })
        .OrderByDescending(x => x.EstimatedReorderCost)
        .ToList();

        return Ok(alerts);
    }

    /// <summary>
    /// Executive Inventory Summary & KPI Analytics (Total active products, valuation, low stock count, stock-in/out, breakdowns).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(InventoryExecutiveSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventorySummary()
    {
        var activeProducts = await _context.Products
            .Where(p => p.IsActive)
            .ToListAsync();

        var inventories = await _context.Inventory
            .Include(i => i.Product)
                .ThenInclude(p => p!.Category)
            .ToListAsync();

        var transactions = await _context.InventoryTransactions.ToListAsync();

        var totalActive = activeProducts.Count;
        decimal totalValuation = 0;
        int lowStockCount = 0;

        foreach (var inv in inventories)
        {
            if (inv.Product != null && inv.Product.IsActive)
            {
                totalValuation += inv.CurrentStock * inv.Product.StandardCost;
                if (inv.CurrentStock <= inv.Product.ReorderLevel)
                {
                    lowStockCount++;
                }
            }
        }

        var stockInTotal = transactions
            .Where(t => t.TransactionType == "StockIn" || t.TransactionType == "Stock In")
            .Sum(t => Math.Abs(t.Quantity));

        var stockOutTotal = transactions
            .Where(t => t.TransactionType == "StockOut" || t.TransactionType == "Stock Out")
            .Sum(t => Math.Abs(t.Quantity));

        var categoryBreakdown = inventories
            .Where(i => i.Product != null)
            .GroupBy(i => i.Product!.Category?.Name ?? "Uncategorized")
            .Select(g => new CategoryStockSummaryDto
            {
                CategoryName = g.Key,
                ProductCount = g.Select(x => x.ProductId).Distinct().Count(),
                TotalStockQuantity = g.Sum(x => x.CurrentStock),
                Valuation = g.Sum(x => x.CurrentStock * (x.Product != null ? x.Product.StandardCost : 0))
            })
            .OrderByDescending(c => c.Valuation)
            .ToList();

        var locationBreakdown = inventories
            .Where(i => i.Product != null)
            .GroupBy(i => i.StorageLocation)
            .Select(g => new LocationStockSummaryDto
            {
                StorageLocation = g.Key,
                ItemCount = g.Count(),
                TotalStockQuantity = g.Sum(x => x.CurrentStock),
                Valuation = g.Sum(x => x.CurrentStock * (x.Product != null ? x.Product.StandardCost : 0))
            })
            .OrderByDescending(l => l.Valuation)
            .ToList();

        return Ok(new InventoryExecutiveSummaryDto
        {
            TotalActiveProducts = totalActive,
            TotalStockValuation = totalValuation,
            LowStockItemCount = lowStockCount,
            TotalStockInQuantity = stockInTotal,
            TotalStockOutQuantity = stockOutTotal,
            CategoryBreakdown = categoryBreakdown,
            LocationBreakdown = locationBreakdown
        });
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "\"\"";
        if (value.Contains(",") || value.Contains("\"") || value.Contains("\n") || value.Contains("\r"))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
