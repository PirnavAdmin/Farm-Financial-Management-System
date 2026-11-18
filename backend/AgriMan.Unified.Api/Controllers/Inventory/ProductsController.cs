using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;
using FarmManagementApi.DTOs;

namespace FarmManagementApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly FarmDbContext _context;

    public ProductsController(FarmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? categoryId, [FromQuery] string? search)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Code.Contains(search));

        var list = await query.ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        using var tx = await _context.Database.BeginTransactionAsync();

        var product = new Products
        {
            Code = dto.Code,
            Name = dto.Name,
            CategoryId = dto.CategoryId,
            UnitId = dto.UnitId,
            ReorderLevel = dto.ReorderLevel,
            StandardCost = dto.StandardCost,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Create initial inventory record
        var inv = new Inventory
        {
            ProductId = product.Id,
            StorageLocation = dto.StorageLocation,
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
                StorageLocation = dto.StorageLocation,
                ReferenceType = "InitialStock",
                BalanceAfterTransaction = dto.InitialStock,
                Notes = "Initial balance on product creation"
            });
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = dto.Name;
        product.CategoryId = dto.CategoryId;
        product.UnitId = dto.UnitId;
        product.ReorderLevel = dto.ReorderLevel;
        product.StandardCost = dto.StandardCost;
        product.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();
        return NoContent();
    }
}