using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("stock_adjustments")]
public class StockAdjustment
{
    public int Id { get; set; }
    public string AdjustmentNumber { get; set; } = string.Empty;
    public DateTime AdjustmentDate { get; set; } = DateTime.UtcNow;
    public int ProductId { get; set; }
    public Products? Product { get; set; }
    public string StorageLocation { get; set; } = "Main Warehouse";
    public decimal BookStock { get; set; }
    public decimal PhysicalStock { get; set; }
    public decimal DifferenceQty => PhysicalStock - BookStock;
    public string Reason { get; set; } = string.Empty; // Damaged, Expired, Spillage, CountDiscrepancy
    public string? Remarks { get; set; }
}