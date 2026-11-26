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
    private string? _code;
    private bool _codeSet;
    private string _name = string.Empty;
    private bool _nameSet;
    private decimal _reorderLevel = 0;
    private bool _reorderLevelSet;
    private decimal _standardCost = 0;
    private bool _standardCostSet;

    public string? Code
    {
        get => _code;
        set { _code = value; if (!string.IsNullOrWhiteSpace(value)) _codeSet = true; }
    } // Optional: auto-generated sequential PRD-NNN if omitted

    public string? ProductCode
    {
        get => _code;
        set { if (!_codeSet && !string.IsNullOrWhiteSpace(value)) _code = value; }
    } // Frontend alias

    [Required(ErrorMessage = "Product Name is required.")]
    [MaxLength(150)]
    public string Name
    {
        get => _name;
        set { _name = value ?? string.Empty; if (!string.IsNullOrWhiteSpace(value)) _nameSet = true; }
    }

    public string? ProductName
    {
        get => _name;
        set { if (!_nameSet && !string.IsNullOrWhiteSpace(value)) _name = value; }
    } // Frontend alias

    [Required(ErrorMessage = "CategoryId is required.")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "UnitId is required.")]
    public int UnitId { get; set; }

    public decimal ReorderLevel
    {
        get => _reorderLevel;
        set { _reorderLevel = value; _reorderLevelSet = true; }
    }

    public decimal? MinimumStockLevel
    {
        get => _reorderLevel;
        set { if (!_reorderLevelSet && value.HasValue) _reorderLevel = value.Value; }
    } // Frontend alias

    public decimal StandardCost
    {
        get => _standardCost;
        set { _standardCost = value; _standardCostSet = true; }
    }

    public decimal? UnitPrice
    {
        get => _standardCost;
        set { if (!_standardCostSet && value.HasValue) _standardCost = value.Value; }
    } // Frontend alias

    public decimal InitialStock { get; set; } = 0;
    public string StorageLocation { get; set; } = "Main Warehouse";
    public bool IsActive { get; set; } = true;
}

public class UpdateProductDto
{
    private string _name = string.Empty;
    private bool _nameSet;
    private decimal _reorderLevel = 0;
    private bool _reorderLevelSet;
    private decimal _standardCost = 0;
    private bool _standardCostSet;

    public string? Code { get; set; }

    [Required(ErrorMessage = "Product Name is required.")]
    [MaxLength(150)]
    public string Name
    {
        get => _name;
        set { _name = value ?? string.Empty; if (!string.IsNullOrWhiteSpace(value)) _nameSet = true; }
    }

    public string? ProductName
    {
        get => _name;
        set { if (!_nameSet && !string.IsNullOrWhiteSpace(value)) _name = value; }
    } // Frontend alias

    [Required(ErrorMessage = "CategoryId is required.")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "UnitId is required.")]
    public int UnitId { get; set; }

    public decimal ReorderLevel
    {
        get => _reorderLevel;
        set { _reorderLevel = value; _reorderLevelSet = true; }
    }

    public decimal? MinimumStockLevel
    {
        get => _reorderLevel;
        set { if (!_reorderLevelSet && value.HasValue) _reorderLevel = value.Value; }
    } // Frontend alias

    public decimal StandardCost
    {
        get => _standardCost;
        set { _standardCost = value; _standardCostSet = true; }
    }

    public decimal? UnitPrice
    {
        get => _standardCost;
        set { if (!_standardCostSet && value.HasValue) _standardCost = value.Value; }
    } // Frontend alias

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
    public bool IsLowStock => ReorderLevel > 0 && CurrentStock <= ReorderLevel;
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
    private string? _notes;
    private bool _notesSet;

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

    public string? Notes
    {
        get => _notes;
        set { _notes = value; if (!string.IsNullOrWhiteSpace(value)) _notesSet = true; }
    }

    public string? Remarks
    {
        get => _notes;
        set { if (!_notesSet && !string.IsNullOrWhiteSpace(value)) _notes = value; }
    }
}

// =========================================================================
// PART 3: STOCK ADJUSTMENTS, LEDGER, LOW STOCK & ANALYTICS (Chandana Paparao)
// =========================================================================

public class CreateStockAdjustmentDto
{
    private string _storageLocation = "Main Warehouse";
    private bool _storageLocationSet;

    [Required(ErrorMessage = "ProductId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "ProductId must be a valid positive integer.")]
    public int ProductId { get; set; }

    [MaxLength(100)]
    public string StorageLocation
    {
        get => _storageLocation;
        set { _storageLocation = string.IsNullOrWhiteSpace(value) ? "Main Warehouse" : value; if (!string.IsNullOrWhiteSpace(value)) _storageLocationSet = true; }
    }

    // Frontend compatibility alias
    public string? Location
    {
        get => _storageLocation;
        set { if (!_storageLocationSet && !string.IsNullOrWhiteSpace(value)) _storageLocation = value; }
    }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Physical stock cannot be negative.")]
    public decimal PhysicalStock { get; set; }

    [Required(ErrorMessage = "Reason is mandatory.")]
    [MaxLength(250)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ApprovedBy { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class StockAdjustmentHistoryDto
{
    public int Id { get; set; }
    public string AdjustmentNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public string Location => StorageLocation;
    public decimal BookStock { get; set; }
    public decimal PhysicalStock { get; set; }
    public decimal DifferenceQty { get; set; }
    public decimal Difference => DifferenceQty;
    public string AdjustmentType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public string? Remarks { get; set; }
    public DateTime AdjustmentDate { get; set; }
}

public class PaginatedStockAdjustmentsResponse
{
    public List<StockAdjustmentHistoryDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class StockLedgerItemDto
{
    public long Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalCost => Math.Round(Math.Abs(Quantity) * UnitPrice, 2);
    public string StorageLocation { get; set; } = string.Empty;
    public string Location => StorageLocation;
    public string? ReferenceType { get; set; }
    public string? ReferenceNumber { get; set; }
    public decimal BalanceAfterTransaction { get; set; }
    public decimal BalanceAfter => BalanceAfterTransaction;
    public string? Notes { get; set; }
}

public class PaginatedStockLedgerResponse
{
    public List<StockLedgerItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class LowStockAlertDto
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string StorageLocation { get; set; } = string.Empty;
    public string Location => StorageLocation;
    public decimal CurrentStock { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal Deficit => Math.Max(0, ReorderLevel - CurrentStock);
    public decimal StandardCost { get; set; }
    public decimal EstimatedReorderCost => Math.Round(Deficit * StandardCost, 2);
    public string Unit { get; set; } = string.Empty;
}

public class InventoryExecutiveSummaryDto
{
    public int TotalActiveProducts { get; set; }
    public decimal TotalStockValuation { get; set; }
    public int LowStockItemCount { get; set; }
    public decimal TotalStockInQuantity { get; set; }
    public decimal TotalStockOutQuantity { get; set; }
    public List<CategoryStockSummaryDto> CategoryBreakdown { get; set; } = new();
    public List<LocationStockSummaryDto> LocationBreakdown { get; set; } = new();
}

public class CategoryStockSummaryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public decimal TotalStockQuantity { get; set; }
    public decimal Valuation { get; set; }
}

public class LocationStockSummaryDto
{
    public string StorageLocation { get; set; } = string.Empty;
    public string Location => StorageLocation;
    public int ItemCount { get; set; }
    public decimal TotalStockQuantity { get; set; }
    public decimal Valuation { get; set; }
}
