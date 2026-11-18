namespace FarmManagementApi.DTOs;

public class CreateProductDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int UnitId { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal StandardCost { get; set; }
    public decimal InitialStock { get; set; } = 0;
    public string StorageLocation { get; set; } = "Main Warehouse";
}

public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int UnitId { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal StandardCost { get; set; }
    public bool IsActive { get; set; }
}

public class StockInDto
{
    public int ProductId { get; set; }
    public string StorageLocation { get; set; } = "Main Warehouse";
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? ReferenceType { get; set; } = "Purchase";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class StockOutDto
{
    public int ProductId { get; set; }
    public string StorageLocation { get; set; } = "Main Warehouse";
    public decimal Quantity { get; set; }
    public string? ReferenceType { get; set; } = "FieldUsage";
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class StockTransferDto
{
    public int ProductId { get; set; }
    public string FromLocation { get; set; } = string.Empty;
    public string ToLocation { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }
}

public class CreateStockAdjustmentDto
{
    public int ProductId { get; set; }
    public string StorageLocation { get; set; } = "Main Warehouse";
    public decimal PhysicalStock { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}