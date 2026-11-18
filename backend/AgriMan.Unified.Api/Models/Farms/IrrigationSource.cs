using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("irrigation_sources")]
public class IrrigationSource
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // Borewell, Canal, Drip, Rain-fed, Well, Sprinkler

    [MaxLength(250)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<FarmLandDetail> FarmLandDetails { get; set; } = new List<FarmLandDetail>();
}
