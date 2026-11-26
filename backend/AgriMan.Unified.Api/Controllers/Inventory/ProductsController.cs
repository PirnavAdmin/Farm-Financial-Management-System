using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using FarmManagementApi.DTOs;
using FarmManagementApi.Services;
using AgriMan.Api.Services;

namespace FarmManagementApi.Controllers;

/// <summary>
/// API endpoints for managing Products, Agricultural Inputs, and Inventory Master.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IAuditService _auditService;

    public ProductsController(
        IInventoryService inventoryService,
        IAuditService auditService)
    {
        _inventoryService = inventoryService;
        _auditService = auditService;
    }

    /// <summary>
    /// Get paginated list of products with optional category, unit, active status, and search filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedProductsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] int? unitId,
        [FromQuery] bool? isActive,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
<<<<<<< Updated upstream
        var result = await _inventoryService.GetProductsAsync(categoryId, unitId, isActive, search, page, pageSize);
        return Ok(result.Data);
    }

    /// <summary>
    /// Get next available collision-free sequential product code (PRD-NNN).
    /// </summary>
    [HttpGet("next-code")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await _inventoryService.GenerateNextProductCodeAsync();
        return Ok(new { nextCode = code, code });
    }

    /// <summary>
    /// Get product by ID with category details and current stock.
    /// </summary>
=======
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Code.Contains(search));

        var list = await query.OrderBy(p => p.Id).ToListAsync();
        return Ok(list);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.ProductCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Id)
            .ToListAsync();
        return Ok(categories);
    }

    [HttpGet("units")]
    public async Task<IActionResult> GetUnits()
    {
        var units = await _context.Units
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .ToListAsync();
        return Ok(units);
    }

>>>>>>> Stashed changes
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
<<<<<<< Updated upstream
        var result = await _inventoryService.GetProductByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }
        return Ok(result.Data);
=======
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound(new { message = $"Product with ID {id} not found." });
        return Ok(product);
>>>>>>> Stashed changes
    }

    /// <summary>
    /// Create a new product. If Code is omitted, automatically assigns sequential PRD-NNN.
    /// Validates CategoryId and UnitId existence, and ensures ReorderLevel and StandardCost are non-negative.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
<<<<<<< Updated upstream
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
=======
        if (string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(new { message = "Product Code is required." });

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Product Name is required." });

        var trimmedCode = dto.Code.Trim();
        var codeExists = await _context.Products.AnyAsync(p => p.Code.ToLower() == trimmedCode.ToLower());
        if (codeExists)
        {
            return BadRequest(new { message = $"A product with code '{trimmedCode}' already exists." });
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var product = new Products
        {
            Code = trimmedCode,
            Name = dto.Name.Trim(),
            CategoryId = dto.CategoryId,
            UnitId = dto.UnitId,
            ReorderLevel = dto.ReorderLevel,
            StandardCost = dto.StandardCost,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Ensure inventory placeholder exists for product integrity
        var inv = new Inventory
        {
            ProductId = product.Id,
            StorageLocation = string.IsNullOrWhiteSpace(dto.StorageLocation) ? "Main Warehouse" : dto.StorageLocation,
            CurrentStock = dto.InitialStock,
            LastUpdated = DateTime.UtcNow
        };
        _context.Inventory.Add(inv);

        if (dto.InitialStock > 0)
        {
            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                ProductId = product.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionType = "StockIn",
                Quantity = dto.InitialStock,
                UnitPrice = dto.StandardCost,
                StorageLocation = inv.StorageLocation,
                ReferenceType = "InitialStock",
                BalanceAfterTransaction = dto.InitialStock,
                Notes = "Initial balance on product creation"
            });
>>>>>>> Stashed changes
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

<<<<<<< Updated upstream
        var result = await _inventoryService.CreateProductAsync(dto, actorId, actorName, ip);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
=======
        await _context.Entry(product).Reference(p => p.Category).LoadAsync();
        await _context.Entry(product).Reference(p => p.Units).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
>>>>>>> Stashed changes
    }

    /// <summary>
    /// Update an existing product. Validates CategoryId and UnitId, and ensures non-negative numbers.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
<<<<<<< Updated upstream
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateProductAsync(id, dto, actorId, actorName, ip);
        if (!result.Success)
        {
            if (result.StatusCode == 404)
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(result.Data);
=======
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = $"Product with ID {id} not found." });

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Product Name is required." });

        if (!string.IsNullOrWhiteSpace(dto.Code) && dto.Code.Trim().ToLower() != product.Code.ToLower())
        {
            var newCode = dto.Code.Trim();
            var codeExists = await _context.Products.AnyAsync(p => p.Id != id && p.Code.ToLower() == newCode.ToLower());
            if (codeExists)
            {
                return BadRequest(new { message = $"A product with code '{newCode}' already exists." });
            }
            product.Code = newCode;
        }

        product.Name = dto.Name.Trim();
        product.CategoryId = dto.CategoryId;
        product.UnitId = dto.UnitId;
        product.ReorderLevel = dto.ReorderLevel;
        product.StandardCost = dto.StandardCost;
        product.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        await _context.Entry(product).Reference(p => p.Category).LoadAsync();
        await _context.Entry(product).Reference(p => p.Units).LoadAsync();

        return Ok(product);
>>>>>>> Stashed changes
    }

    /// <summary>
    /// Update active status of a product (activate / deactivate).
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateProductStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateProductStatusAsync(id, dto.IsActive, actorId, actorName, ip);
        if (!result.Success)
        {
            if (result.StatusCode == 404)
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Soft delete (deactivate) a product to maintain relational integrity with transactions and purchases.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
<<<<<<< Updated upstream
        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.DeleteProductAsync(id, actorId, actorName, ip);
        if (!result.Success)
        {
            if (result.StatusCode == 404)
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { success = true, message = result.Message });
=======
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = $"Product with ID {id} not found." });

        var isReferenced = await _context.PurchaseItems.AnyAsync(pi => pi.ProductName.ToLower() == product.Name.ToLower())
            || await _context.InventoryTransactions.AnyAsync(it => it.ProductId == id)
            || await _context.Inventory.AnyAsync(inv => inv.ProductId == id && inv.CurrentStock > 0);

        if (isReferenced)
        {
            product.IsActive = false; // Established safe deactivation behavior
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product is referenced by existing records and has been safely deactivated instead of deleted.", deactivated = true });
        }

        var zeroInv = await _context.Inventory.Where(i => i.ProductId == id).ToListAsync();
        if (zeroInv.Any()) _context.Inventory.RemoveRange(zeroInv);

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Product deleted successfully.", deactivated = false });
>>>>>>> Stashed changes
    }
}
