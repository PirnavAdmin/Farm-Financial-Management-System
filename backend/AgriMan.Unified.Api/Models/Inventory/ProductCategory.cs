using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("product_categories")]
public class ProductCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Seeds, Fertilizers, Pesticides, Sprayer chemicals, Spare parts, Other consumables
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}