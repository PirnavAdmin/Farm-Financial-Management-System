using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs;

public class ProductCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int ProductsCount { get; set; }
}

public class CreateProductCategoryDto
{
    [Required(ErrorMessage = "Category Name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateProductCategoryDto
{
    [Required(ErrorMessage = "Category Name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UnitDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int ProductsCount { get; set; }
}

public class CreateUnitDto
{
    [Required(ErrorMessage = "Unit Name is required.")]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Short Code is required.")]
    [MaxLength(20)]
    public string ShortCode { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class UpdateUnitDto
{
    [Required(ErrorMessage = "Unit Name is required.")]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Short Code is required.")]
    [MaxLength(20)]
    public string ShortCode { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class CreateProductDto
{
    public string? Code { get; set; } // Optional: auto-generated sequential PRD-NNN if omitted
    public string? ProductCode { get => Code; set => Code = value; } // Frontend alias

    [Required(ErrorMessage = "Product Name is required.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    public string? ProductName { get => Name; set => Name = value; } // Frontend alias

    [Required(ErrorMessage = "CategoryId is required.")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "UnitId is required.")]
    public int UnitId { get; set; }

    public decimal ReorderLevel { get; set; } = 0;
    public decimal? MinimumStockLevel { get => ReorderLevel; set => ReorderLevel = value ?? 0; } // Frontend alias

    public decimal StandardCost { get; set; } = 0;
    public decimal? UnitPrice { get => StandardCost; set => StandardCost = value ?? 0; } // Frontend alias

    public decimal InitialStock { get; set; } = 0;
    public string StorageLocation { get; set; } = "Main Warehouse";
    public bool IsActive { get; set; } = true;
}

public class UpdateProductDto
{
    [Required(ErrorMessage = "Product Name is required.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    public string? ProductName { get => Name; set => Name = value; } // Frontend alias

    [Required(ErrorMessage = "CategoryId is required.")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "UnitId is required.")]
    public int UnitId { get; set; }

    public decimal ReorderLevel { get; set; } = 0;
    public decimal? MinimumStockLevel { get => ReorderLevel; set => ReorderLevel = value ?? 0; } // Frontend alias

    public decimal StandardCost { get; set; } = 0;
    public decimal? UnitPrice { get => StandardCost; set => StandardCost = value ?? 0; } // Frontend alias

    public bool IsActive { get; set; } = true;
}

public class UpdateProductStatusDto
{
    [Required]
    public bool IsActive { get; set; }
}

// =========================================================================
// PART 2: STOCK MOVEMENT ENGINE DTOs (Kalyan kumar vanumu)
// =========================================================================

public class ProductDetailDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ProductCode => Code; // Frontend alias
    public string Name { get; set; } = string.Empty;
    public string ProductName => Name; // Frontend alias
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Category => CategoryName; // Frontend alias
    public int UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public string UnitShortCode { get; set; } = string.Empty;
    public string Unit => UnitShortCode; // Frontend alias
    public decimal ReorderLevel { get; set; }
    public decimal MinimumStockLevel => ReorderLevel; // Frontend alias
    public decimal StandardCost { get; set; }
    public decimal UnitPrice => StandardCost; // Frontend alias
    public decimal CurrentStock { get; set; }
    public decimal ReservedStock { get; set; }
    public bool IsActive { get; set; } = true;
    public string Status => IsActive ? "Active" : "Inactive";
}

public class PaginatedProductsResponse
{
    public List<ProductDetailDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class StockDirectoryItemDto
{
    public int InventoryId { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReservedStock { get; set; }
    public decimal AvailableStock => Math.Max(0, CurrentStock - ReservedStock);
    public string Unit { get; set; } = string.Empty;
    public decimal StandardCost { get; set; }
    public decimal TotalValue => Math.Round(CurrentStock * StandardCost, 2);
    public decimal ReorderLevel { get; set; }
    public bool IsLowStock => CurrentStock <= ReorderLevel;
    public DateTime LastUpdated { get; set; }
}

public class PaginatedStockDirectoryResponse
{
    public List<StockDirectoryItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class ProductStockBreakdownDto
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal ReorderLevel { get; set; }
    public decimal TotalStockAllLocations { get; set; }
    public decimal TotalValueAllLocations { get; set; }
    public List<LocationStockBreakdownDto> Locations { get; set; } = new();
}

public class LocationStockBreakdownDto
{
    public string StorageLocation { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal ReservedStock { get; set; }
    public decimal AvailableStock => Math.Max(0, CurrentStock - ReservedStock);
    public decimal UnitPrice { get; set; }
    public decimal TotalValue => Math.Round(CurrentStock * UnitPrice, 2);
    public DateTime LastUpdated { get; set; }
}

public class StockInDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    public string StorageLocation { get; set; } = "Main Warehouse";

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Unit price cannot be negative.")]
    public decimal UnitPrice { get; set; }

    public int? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? ReferenceType { get; set; } = "Purchase";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class StockOutDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    public string StorageLocation { get; set; } = "Main Warehouse";

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    public int? FarmId { get; set; }
    public int? CropId { get; set; }
    public string? IssuedTo { get; set; }
    public string? Purpose { get; set; }
    public string? ReferenceType { get; set; } = "FieldUsage";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class StockTransferDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FromLocation { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ToLocation { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Transfer quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    public string? Notes { get; set; }
    public string? Remarks { get => Notes; set => Notes = value; }
}

public class CreateStockAdjustmentDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    public string StorageLocation { get; set; } = "Main Warehouse";

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Physical stock cannot be negative.")]
    public decimal PhysicalStock { get; set; }

    [Required(ErrorMessage = "Reason is mandatory.")]
    [MaxLength(100)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
