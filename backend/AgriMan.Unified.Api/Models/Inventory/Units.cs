using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("units")]
public class Units
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Kilograms, Litres, Bags
    public string ShortCode { get; set; } = string.Empty; // kg, ltr, bag
    public bool IsActive { get; set; } = true;
}