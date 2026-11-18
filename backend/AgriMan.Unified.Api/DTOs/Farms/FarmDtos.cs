using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs;

public class FarmListItemDto
{
    public int Id { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public string SurveyNumber { get; set; } = string.Empty;
    public string LandType { get; set; } = string.Empty;
    public int FarmerId { get; set; }
    public string FarmerName { get; set; } = string.Empty;
    public decimal LandArea { get; set; }
    public string AreaUnit { get; set; } = string.Empty;
    public string FormattedArea => $"{LandArea} {AreaUnit}";
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string LocationFormatted => $"{Village}\n{Mandal}, {District}";
    public string OwnershipType { get; set; } = string.Empty;
    public string IrrigationType { get; set; } = string.Empty;
    public string SoilType { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
}

public class FarmDetailDto
{
    public int Id { get; set; }
    public int FarmerId { get; set; }
    public string FarmerName { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string OwnershipType { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? Pincode { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<LandDetailDto> LandDetails { get; set; } = new();
    public List<FarmDocumentDto> Documents { get; set; } = new();
}

public class CreateFarmRequest
{
    [Required]
    public int FarmerId { get; set; }

    [Required]
    [MaxLength(150)]
    public string FarmName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string OwnershipType { get; set; } = "Owned"; // Owned, Leased, Shared

    [Required]
    [MaxLength(100)]
    public string Village { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Mandal { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = "Andhra Pradesh";

    [MaxLength(10)]
    public string? Pincode { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    // Initial Land Detail (Screen captures both farm and primary land info together)
    [Required]
    [MaxLength(100)]
    public string SurveyNumber { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 100000.0)]
    public decimal LandArea { get; set; }

    [Required]
    [MaxLength(50)]
    public string AreaUnit { get; set; } = "Acres"; // Acres, Hectares, Cents, Square Feet, Gunthas

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

public class UpdateFarmRequest
{
    [Required]
    public int FarmerId { get; set; }

    [Required]
    [MaxLength(150)]
    public string FarmName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string OwnershipType { get; set; } = "Owned";

    [Required]
    [MaxLength(100)]
    public string Village { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Mandal { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = "Andhra Pradesh";

    [MaxLength(10)]
    public string? Pincode { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    // Primary Land Detail Update
    public int? LandDetailId { get; set; }

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
