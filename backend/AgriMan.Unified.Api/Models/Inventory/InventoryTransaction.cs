using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("inventory_transactions")]
public class InventoryTransaction
{
    public long Id { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public int ProductId { get; set; }
    public Products? Product { get; set; }
    public string TransactionType { get; set; } = string.Empty; // StockIn, StockOut, TransferIn, TransferOut, Adjustment
    public decimal Quantity { get; set; } // + for In, - for Out
    public decimal UnitPrice { get; set; }
    public string StorageLocation { get; set; } = string.Empty;
    public string? ReferenceType { get; set; } // Purchase, FieldUsage, Transfer, StockCheck
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public decimal BalanceAfterTransaction { get; set; }
}