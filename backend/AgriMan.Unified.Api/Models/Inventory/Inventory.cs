using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("inventory")]
public class Inventory
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    [ForeignKey("ProductId")]
    public Products? Product { get; set; }

    public string StorageLocation { get; set; } = "Main Warehouse";

    [Column(TypeName = "decimal(18,2)")]
    public decimal CurrentStock { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ReservedStock { get; set; } = 0;

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
