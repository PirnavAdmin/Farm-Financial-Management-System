using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs;

public class LandDetailDto
{
    public int Id { get; set; }
    public int FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public string SurveyNumber { get; set; } = string.Empty;
    public decimal LandArea { get; set; }
    public string AreaUnit { get; set; } = string.Empty;
    public string LandType { get; set; } = string.Empty;
    public int? IrrigationSourceId { get; set; }
    public string IrrigationSourceName { get; set; } = string.Empty;
    public int? SoilTypeId { get; set; }
    public string SoilTypeName { get; set; } = string.Empty;
    public string? BoundariesNorth { get; set; }
    public string? BoundariesSouth { get; set; }
    public string? BoundariesEast { get; set; }
    public string? BoundariesWest { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateLandDetailRequest
{
    [Required]
    public int FarmId { get; set; }

    [Required]
    [MaxLength(100)]
    public string SurveyNumber { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 100000.0)]
    public decimal LandArea { get; set; }

    [Required]
    [MaxLength(50)]
    public string AreaUnit { get; set; } = "Acres";

    [Required]
    [MaxLength(100)]
    public string LandType { get; set; } = "Agricultural";

    public int? IrrigationSourceId { get; set; }

    public int? SoilTypeId { get; set; }

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
}

public class UpdateLandDetailRequest
{
    [Required]
    [MaxLength(100)]
    public string SurveyNumber { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 100000.0)]
    public decimal LandArea { get; set; }

    [Required]
    [MaxLength(50)]
    public string AreaUnit { get; set; } = "Acres";

    [Required]
    [MaxLength(100)]
    public string LandType { get; set; } = "Agricultural";

    public int? IrrigationSourceId { get; set; }

    public int? SoilTypeId { get; set; }

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
}
