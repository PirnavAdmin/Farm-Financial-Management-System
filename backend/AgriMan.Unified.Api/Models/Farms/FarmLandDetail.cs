using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("farm_land_details")]
public class FarmLandDetail
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FarmId { get; set; }

    [ForeignKey(nameof(FarmId))]
    public Farm? Farm { get; set; }

    [Required]
    [MaxLength(100)]
    public string SurveyNumber { get; set; } = string.Empty; // e.g. 123/A, 125/B, 124/2A

    [Column(TypeName = "decimal(18, 2)")]
    public decimal LandArea { get; set; } // e.g. 5.00, 3.00, 4.50

    [Required]
    [MaxLength(50)]
    public string AreaUnit { get; set; } = "Acres"; // Acres, Hectares, Cents, Square Feet, Gunthas

    [Required]
    [MaxLength(100)]
    public string LandType { get; set; } = "Agricultural"; // Agricultural, Commercial, Wet Land, Dry Land

    public int? IrrigationSourceId { get; set; }

    [ForeignKey(nameof(IrrigationSourceId))]
    public IrrigationSource? IrrigationSource { get; set; }

    public int? SoilTypeId { get; set; }

    [ForeignKey(nameof(SoilTypeId))]
    public SoilType? SoilType { get; set; }

    [MaxLength(200)]
    public string? BoundariesNorth { get; set; }

    [MaxLength(200)]
    public string? BoundariesSouth { get; set; }

    [MaxLength(200)]
    public string? BoundariesEast { get; set; }

    [MaxLength(200)]
    public string? BoundariesWest { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
