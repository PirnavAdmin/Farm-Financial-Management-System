using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using AgriMan.Api.Services;

namespace FarmManagementApi.Services;

public class InventoryService : IInventoryService
{
    private readonly FarmDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ILogger<InventoryService> _logger;

    public InventoryService(
        FarmDbContext context,
        IAuditService auditService,
        ILogger<InventoryService> logger)
    {
        _context = context;
        _auditService = auditService;
        _logger = logger;
    }

    #region 1. Product Categories

    public async Task<ServiceResult<List<ProductCategoryDto>>> GetCategoriesAsync(bool? isActive = null, string? search = null)
    {
        var query = _context.ProductCategories.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) || (c.Description != null && c.Description.ToLower().Contains(s)));
        }

        var categories = await query.OrderBy(c => c.Name).ToListAsync();

        var categoryIds = categories.Select(c => c.Id).ToList();
        var productCounts = await _context.Products
            .Where(p => categoryIds.Contains(p.CategoryId) && p.IsActive)
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

        var result = categories.Select(c => new ProductCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            IsActive = c.IsActive,
            ProductsCount = productCounts.GetValueOrDefault(c.Id, 0)
        }).ToList();

        return ServiceResult<List<ProductCategoryDto>>.Ok(result);
    }

    public async Task<ServiceResult<ProductCategoryDto>> GetCategoryByIdAsync(int id)
    {
        var category = await _context.ProductCategories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
        {
            return ServiceResult<ProductCategoryDto>.NotFound($"Product category with ID {id} was not found.");
        }

        var count = await _context.Products.CountAsync(p => p.CategoryId == id && p.IsActive);

        var dto = new ProductCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ProductsCount = count
        };

        return ServiceResult<ProductCategoryDto>.Ok(dto);
    }

    public async Task<ServiceResult<ProductCategoryDto>> CreateCategoryAsync(
        CreateProductCategoryDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var trimmedName = dto.Name.Trim();
        var exists = await _context.ProductCategories.AnyAsync(c => c.Name.ToLower() == trimmedName.ToLower());
        if (exists)
        {
            return ServiceResult<ProductCategoryDto>.Fail($"A product category with name '{trimmedName}' already exists.", 400);
        }

        var category = new ProductCategory
        {
            Name = trimmedName,
            Description = dto.Description?.Trim(),
            IsActive = dto.IsActive
        };

        _context.ProductCategories.Add(category);
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "CREATE",
            "ProductCategory",
            category.Id.ToString(),
            $"Created product category '{category.Name}' (Active: {category.IsActive})",
            ipAddress);

        var resultDto = new ProductCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ProductsCount = 0
        };

        return ServiceResult<ProductCategoryDto>.Created(resultDto, "Product category created successfully.");
    }

    public async Task<ServiceResult<ProductCategoryDto>> UpdateCategoryAsync(
        int id,
        UpdateProductCategoryDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var category = await _context.ProductCategories.FindAsync(id);
        if (category == null)
        {
            return ServiceResult<ProductCategoryDto>.NotFound($"Product category with ID {id} was not found.");
        }

        var trimmedName = dto.Name.Trim();
        var exists = await _context.ProductCategories.AnyAsync(c => c.Id != id && c.Name.ToLower() == trimmedName.ToLower());
        if (exists)
        {
            return ServiceResult<ProductCategoryDto>.Fail($"Another product category with name '{trimmedName}' already exists.", 400);
        }

        category.Name = trimmedName;
        category.Description = dto.Description?.Trim();
        category.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var count = await _context.Products.CountAsync(p => p.CategoryId == id && p.IsActive);

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "UPDATE",
            "ProductCategory",
            category.Id.ToString(),
            $"Updated product category '{category.Name}' (Active: {category.IsActive})",
            ipAddress);

        var resultDto = new ProductCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            IsActive = category.IsActive,
            ProductsCount = count
        };

        return ServiceResult<ProductCategoryDto>.Ok(resultDto, "Product category updated successfully.");
    }

    public async Task<ServiceResult<bool>> DeleteCategoryAsync(
        int id,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var category = await _context.ProductCategories.FindAsync(id);
        if (category == null)
        {
            return ServiceResult<bool>.NotFound($"Product category with ID {id} was not found.");
        }

        // Hard requirement: Block delete if linked to active products
        var activeProductsCount = await _context.Products.CountAsync(p => p.CategoryId == id && p.IsActive);
        if (activeProductsCount > 0)
        {
            return ServiceResult<bool>.Fail(
                $"Cannot delete category '{category.Name}' because it is linked to {activeProductsCount} active product(s). Please reassign or deactivate the linked products first.",
                400);
        }

        // Check if linked to any archived/inactive products
        var anyProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (anyProducts)
        {
            category.IsActive = false;
            await _context.SaveChangesAsync();
        }
        else
        {
            _context.ProductCategories.Remove(category);
            await _context.SaveChangesAsync();
        }

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "DELETE",
            "ProductCategory",
            id.ToString(),
            $"Deleted/Deactivated product category '{category.Name}'",
            ipAddress);

        return ServiceResult<bool>.Ok(true, $"Product category '{category.Name}' deleted successfully.");
    }

    #endregion

    #region 2. Units

    public async Task<ServiceResult<List<UnitDto>>> GetUnitsAsync(bool? isActive = null, string? search = null)
    {
        var query = _context.Units.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(s) || u.ShortCode.ToLower().Contains(s));
        }

        var units = await query.OrderBy(u => u.Name).ToListAsync();

        var unitIds = units.Select(u => u.Id).ToList();
        var productCounts = await _context.Products
            .Where(p => unitIds.Contains(p.UnitId) && p.IsActive)
            .GroupBy(p => p.UnitId)
            .Select(g => new { UnitId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UnitId, x => x.Count);

        var result = units.Select(u => new UnitDto
        {
            Id = u.Id,
            Name = u.Name,
            ShortCode = u.ShortCode,
            IsActive = u.IsActive,
            ProductsCount = productCounts.GetValueOrDefault(u.Id, 0)
        }).ToList();

        return ServiceResult<List<UnitDto>>.Ok(result);
    }

    public async Task<ServiceResult<UnitDto>> GetUnitByIdAsync(int id)
    {
        var unit = await _context.Units.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (unit == null)
        {
            return ServiceResult<UnitDto>.NotFound($"Unit with ID {id} was not found.");
        }

        var count = await _context.Products.CountAsync(p => p.UnitId == id && p.IsActive);

        var dto = new UnitDto
        {
            Id = unit.Id,
            Name = unit.Name,
            ShortCode = unit.ShortCode,
            IsActive = unit.IsActive,
            ProductsCount = count
        };

        return ServiceResult<UnitDto>.Ok(dto);
    }

    public async Task<ServiceResult<UnitDto>> CreateUnitAsync(
        CreateUnitDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var trimmedCode = dto.ShortCode.Trim();
        var trimmedName = dto.Name.Trim();

        var exists = await _context.Units.AnyAsync(u =>
            u.ShortCode.ToLower() == trimmedCode.ToLower() ||
            u.Name.ToLower() == trimmedName.ToLower());

        if (exists)
        {
            return ServiceResult<UnitDto>.Fail($"A unit with name '{trimmedName}' or code '{trimmedCode}' already exists.", 400);
        }

        var unit = new Units
        {
            Name = trimmedName,
            ShortCode = trimmedCode,
            IsActive = dto.IsActive
        };

        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "CREATE",
            "Unit",
            unit.Id.ToString(),
            $"Created unit '{unit.Name}' ({unit.ShortCode})",
            ipAddress);

        var resultDto = new UnitDto
        {
            Id = unit.Id,
            Name = unit.Name,
            ShortCode = unit.ShortCode,
            IsActive = unit.IsActive,
            ProductsCount = 0
        };

        return ServiceResult<UnitDto>.Created(resultDto, "Unit created successfully.");
    }

    public async Task<ServiceResult<UnitDto>> UpdateUnitAsync(
        int id,
        UpdateUnitDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var unit = await _context.Units.FindAsync(id);
        if (unit == null)
        {
            return ServiceResult<UnitDto>.NotFound($"Unit with ID {id} was not found.");
        }

        var trimmedCode = dto.ShortCode.Trim();
        var trimmedName = dto.Name.Trim();

        var exists = await _context.Units.AnyAsync(u =>
            u.Id != id &&
            (u.ShortCode.ToLower() == trimmedCode.ToLower() || u.Name.ToLower() == trimmedName.ToLower()));

        if (exists)
        {
            return ServiceResult<UnitDto>.Fail($"Another unit with name '{trimmedName}' or code '{trimmedCode}' already exists.", 400);
        }

        unit.Name = trimmedName;
        unit.ShortCode = trimmedCode;
        unit.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var count = await _context.Products.CountAsync(p => p.UnitId == id && p.IsActive);

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "UPDATE",
            "Unit",
            unit.Id.ToString(),
            $"Updated unit '{unit.Name}' ({unit.ShortCode})",
            ipAddress);

        var resultDto = new UnitDto
        {
            Id = unit.Id,
            Name = unit.Name,
            ShortCode = unit.ShortCode,
            IsActive = unit.IsActive,
            ProductsCount = count
        };

        return ServiceResult<UnitDto>.Ok(resultDto, "Unit updated successfully.");
    }

    public async Task<ServiceResult<bool>> DeleteUnitAsync(
        int id,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var unit = await _context.Units.FindAsync(id);
        if (unit == null)
        {
            return ServiceResult<bool>.NotFound($"Unit with ID {id} was not found.");
        }

        // Hard requirement: Block delete if linked to active products
        var activeProductsCount = await _context.Products.CountAsync(p => p.UnitId == id && p.IsActive);
        if (activeProductsCount > 0)
        {
            return ServiceResult<bool>.Fail(
                $"Cannot delete unit '{unit.Name}' ({unit.ShortCode}) because it is linked to {activeProductsCount} active product(s). Please reassign or deactivate the linked products first.",
                400);
        }

        var anyProducts = await _context.Products.AnyAsync(p => p.UnitId == id);
        if (anyProducts)
        {
            unit.IsActive = false;
            await _context.SaveChangesAsync();
        }
        else
        {
            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();
        }

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "DELETE",
            "Unit",
            id.ToString(),
            $"Deleted/Deactivated unit '{unit.Name}' ({unit.ShortCode})",
            ipAddress);

        return ServiceResult<bool>.Ok(true, $"Unit '{unit.Name}' deleted successfully.");
    }

    #endregion

    #region 3. Products

    public async Task<string> GenerateNextProductCodeAsync()
    {
        var existingCodes = await _context.Products
            .Select(p => p.Code)
            .ToListAsync();

        var maxNumber = 0;
        foreach (var code in existingCodes)
        {
            if (string.IsNullOrWhiteSpace(code)) continue;
            var upper = code.Trim().ToUpperInvariant();
            if (upper.StartsWith("PRD-"))
            {
                var suffix = upper.Substring(4);
                if (int.TryParse(suffix, out int n) && n > maxNumber)
                {
                    maxNumber = n;
                }
            }
        }

        var nextNumber = maxNumber + 1;
        var nextCode = $"PRD-{nextNumber:D3}";

        var existingSet = new HashSet<string>(existingCodes, StringComparer.OrdinalIgnoreCase);
        while (existingSet.Contains(nextCode))
        {
            nextNumber++;
            nextCode = $"PRD-{nextNumber:D3}";
        }

        return nextCode;
    }

    public async Task<ServiceResult<PaginatedProductsResponse>> GetProductsAsync(
        int? categoryId = null,
        int? unitId = null,
        bool? isActive = null,
        string? search = null,
        int page = 1,
        int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .AsNoTracking()
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (unitId.HasValue)
        {
            query = query.Where(p => p.UnitId == unitId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                p.Code.ToLower().Contains(s) ||
                (p.Category != null && p.Category.Name.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var productIds = products.Select(p => p.Id).ToList();

        var stocks = await _context.Inventory
            .Where(i => productIds.Contains(i.ProductId))
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                CurrentStock = g.Sum(x => x.CurrentStock),
                ReservedStock = g.Sum(x => x.ReservedStock)
            })
            .ToDictionaryAsync(x => x.ProductId);

        var items = products.Select(p =>
        {
            var stock = stocks.GetValueOrDefault(p.Id);
            return new ProductDetailDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? "Uncategorized",
                UnitId = p.UnitId,
                UnitName = p.Units?.Name ?? "Unit",
                UnitShortCode = p.Units?.ShortCode ?? "",
                ReorderLevel = p.ReorderLevel,
                StandardCost = p.StandardCost,
                CurrentStock = stock?.CurrentStock ?? 0,
                ReservedStock = stock?.ReservedStock ?? 0,
                IsActive = p.IsActive
            };
        }).ToList();

        var response = new PaginatedProductsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return ServiceResult<PaginatedProductsResponse>.Ok(response);
    }

    public async Task<ServiceResult<ProductDetailDto>> GetProductByIdAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return ServiceResult<ProductDetailDto>.NotFound($"Product with ID {id} was not found.");
        }

        var stock = await _context.Inventory
            .Where(i => i.ProductId == id)
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                CurrentStock = g.Sum(x => x.CurrentStock),
                ReservedStock = g.Sum(x => x.ReservedStock)
            })
            .FirstOrDefaultAsync();

        var dto = new ProductDetailDto
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? "Uncategorized",
            UnitId = product.UnitId,
            UnitName = product.Units?.Name ?? "Unit",
            UnitShortCode = product.Units?.ShortCode ?? "",
            ReorderLevel = product.ReorderLevel,
            StandardCost = product.StandardCost,
            CurrentStock = stock?.CurrentStock ?? 0,
            ReservedStock = stock?.ReservedStock ?? 0,
            IsActive = product.IsActive
        };

        return ServiceResult<ProductDetailDto>.Ok(dto);
    }

    public async Task<ServiceResult<ProductDetailDto>> CreateProductAsync(
        CreateProductDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        // 1. Validations: Non-negative numbers
        if (dto.ReorderLevel < 0)
        {
            return ServiceResult<ProductDetailDto>.Fail("ReorderLevel must be non-negative (>= 0).", 400);
        }

        if (dto.StandardCost < 0)
        {
            return ServiceResult<ProductDetailDto>.Fail("StandardCost must be non-negative (>= 0).", 400);
        }

        if (dto.InitialStock < 0)
        {
            return ServiceResult<ProductDetailDto>.Fail("InitialStock must be non-negative (>= 0).", 400);
        }

        // 2. Foreign Key existence checks
        var category = await _context.ProductCategories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return ServiceResult<ProductDetailDto>.Fail($"Product category with ID {dto.CategoryId} does not exist.", 400);
        }

        var unit = await _context.Units.FindAsync(dto.UnitId);
        if (unit == null)
        {
            return ServiceResult<ProductDetailDto>.Fail($"Unit with ID {dto.UnitId} does not exist.", 400);
        }

        // 3. Sequential PRD-NNN generation & duplicate code check
        string productCode;
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            productCode = await GenerateNextProductCodeAsync();
        }
        else
        {
            productCode = dto.Code.Trim();
            var codeExists = await _context.Products.AnyAsync(p => p.Code.ToLower() == productCode.ToLower());
            if (codeExists)
            {
                return ServiceResult<ProductDetailDto>.Fail($"A product with code '{productCode}' already exists.", 400);
            }
        }

        using var tx = await _context.Database.BeginTransactionAsync();

        var product = new Products
        {
            Code = productCode,
            Name = dto.Name.Trim(),
            CategoryId = dto.CategoryId,
            UnitId = dto.UnitId,
            ReorderLevel = dto.ReorderLevel,
            StandardCost = dto.StandardCost,
            IsActive = dto.IsActive
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var storageLoc = string.IsNullOrWhiteSpace(dto.StorageLocation) ? "Main Warehouse" : dto.StorageLocation.Trim();

        var inv = new Inventory
        {
            ProductId = product.Id,
            StorageLocation = storageLoc,
            CurrentStock = dto.InitialStock,
            ReservedStock = 0,
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
                StorageLocation = storageLoc,
                ReferenceType = "InitialStock",
                ReferenceNumber = $"INIT-{product.Code}",
                Notes = "Initial balance recorded on product creation",
                BalanceAfterTransaction = dto.InitialStock
            });
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "CREATE",
            "Product",
            product.Id.ToString(),
            $"Created product '{product.Name}' ({product.Code}) in category '{category.Name}', Unit '{unit.ShortCode}', Initial Stock: {dto.InitialStock}",
            ipAddress);

        var resultDto = new ProductDetailDto
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            UnitId = product.UnitId,
            UnitName = unit.Name,
            UnitShortCode = unit.ShortCode,
            ReorderLevel = product.ReorderLevel,
            StandardCost = product.StandardCost,
            CurrentStock = dto.InitialStock,
            ReservedStock = 0,
            IsActive = product.IsActive
        };

        return ServiceResult<ProductDetailDto>.Created(resultDto, $"Product '{product.Name}' ({product.Code}) created successfully.");
    }

    public async Task<ServiceResult<ProductDetailDto>> UpdateProductAsync(
        int id,
        UpdateProductDto dto,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return ServiceResult<ProductDetailDto>.NotFound($"Product with ID {id} was not found.");
        }

        if (dto.ReorderLevel < 0)
        {
            return ServiceResult<ProductDetailDto>.Fail("ReorderLevel must be non-negative (>= 0).", 400);
        }

        if (dto.StandardCost < 0)
        {
            return ServiceResult<ProductDetailDto>.Fail("StandardCost must be non-negative (>= 0).", 400);
        }

        var category = await _context.ProductCategories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return ServiceResult<ProductDetailDto>.Fail($"Product category with ID {dto.CategoryId} does not exist.", 400);
        }

        var unit = await _context.Units.FindAsync(dto.UnitId);
        if (unit == null)
        {
            return ServiceResult<ProductDetailDto>.Fail($"Unit with ID {dto.UnitId} does not exist.", 400);
        }

        product.Name = dto.Name.Trim();
        product.CategoryId = dto.CategoryId;
        product.UnitId = dto.UnitId;
        product.ReorderLevel = dto.ReorderLevel;
        product.StandardCost = dto.StandardCost;
        product.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var stock = await _context.Inventory
            .Where(i => i.ProductId == id)
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                CurrentStock = g.Sum(x => x.CurrentStock),
                ReservedStock = g.Sum(x => x.ReservedStock)
            })
            .FirstOrDefaultAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "UPDATE",
            "Product",
            product.Id.ToString(),
            $"Updated product '{product.Name}' ({product.Code}), Category: '{category.Name}', StandardCost: {product.StandardCost}, ReorderLevel: {product.ReorderLevel}, Active: {product.IsActive}",
            ipAddress);

        var resultDto = new ProductDetailDto
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            UnitId = product.UnitId,
            UnitName = unit.Name,
            UnitShortCode = unit.ShortCode,
            ReorderLevel = product.ReorderLevel,
            StandardCost = product.StandardCost,
            CurrentStock = stock?.CurrentStock ?? 0,
            ReservedStock = stock?.ReservedStock ?? 0,
            IsActive = product.IsActive
        };

        return ServiceResult<ProductDetailDto>.Ok(resultDto, $"Product '{product.Name}' updated successfully.");
    }

    public async Task<ServiceResult<ProductDetailDto>> UpdateProductStatusAsync(
        int id,
        bool isActive,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return ServiceResult<ProductDetailDto>.NotFound($"Product with ID {id} was not found.");
        }

        product.IsActive = isActive;
        await _context.SaveChangesAsync();

        var stock = await _context.Inventory
            .Where(i => i.ProductId == id)
            .GroupBy(i => i.ProductId)
            .Select(g => new
            {
                CurrentStock = g.Sum(x => x.CurrentStock),
                ReservedStock = g.Sum(x => x.ReservedStock)
            })
            .FirstOrDefaultAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "STATUS_CHANGE",
            "Product",
            product.Id.ToString(),
            $"Updated status for product '{product.Name}' ({product.Code}) to {(isActive ? "Active" : "Inactive")}",
            ipAddress);

        var resultDto = new ProductDetailDto
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? "Uncategorized",
            UnitId = product.UnitId,
            UnitName = product.Units?.Name ?? "Unit",
            UnitShortCode = product.Units?.ShortCode ?? "",
            ReorderLevel = product.ReorderLevel,
            StandardCost = product.StandardCost,
            CurrentStock = stock?.CurrentStock ?? 0,
            ReservedStock = stock?.ReservedStock ?? 0,
            IsActive = product.IsActive
        };

        return ServiceResult<ProductDetailDto>.Ok(resultDto, $"Product '{product.Name}' status changed to {(isActive ? "Active" : "Inactive")}.");
    }

    public async Task<ServiceResult<bool>> DeleteProductAsync(
        int id,
        int? actorUserId = null,
        string? actorName = null,
        string? ipAddress = null)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return ServiceResult<bool>.NotFound($"Product with ID {id} was not found.");
        }

        // Soft delete (deactivate) to protect relational integrity with PurchaseItems, InventoryTransactions, Sales, etc.
        product.IsActive = false;
        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(
            actorUserId,
            actorName,
            "DELETE",
            "Product",
            product.Id.ToString(),
            $"Deactivated/Soft-deleted product '{product.Name}' ({product.Code})",
            ipAddress);

        return ServiceResult<bool>.Ok(true, $"Product '{product.Name}' deactivated successfully.");
    }

    #endregion
}
