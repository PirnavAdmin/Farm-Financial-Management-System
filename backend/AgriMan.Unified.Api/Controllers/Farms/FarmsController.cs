using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmsController : ControllerBase
{
    private readonly FarmDbContext _context;
    private readonly ILogger<FarmsController> _logger;

    public FarmsController(FarmDbContext context, ILogger<FarmsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets all farms with search, ownership filter, and status filter (matches the AGRIMAN Masters/Farms screen)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FarmListItemDto>>> GetFarms(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? ownership = null)
    {
        var query = _context.Farms
            .Include(f => f.Farmer)
            .Include(f => f.LandDetails)
                .ThenInclude(ld => ld.IrrigationSource)
            .Include(f => f.LandDetails)
                .ThenInclude(ld => ld.SoilType)
            .AsNoTracking();

        // Status Filter
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(f => f.Status == status);
        }

        // Ownership Filter
        if (!string.IsNullOrWhiteSpace(ownership) && !ownership.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(f => f.OwnershipType == ownership);
        }

        // Search Filter (Farms, Farmers, Survey No, Location)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(f =>
                f.FarmName.ToLower().Contains(term) ||
                (f.Farmer != null && f.Farmer.FullName.ToLower().Contains(term)) ||
                f.Village.ToLower().Contains(term) ||
                f.Mandal.ToLower().Contains(term) ||
                f.District.ToLower().Contains(term) ||
                f.LandDetails.Any(ld => ld.SurveyNumber.ToLower().Contains(term))
            );
        }

        var farms = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();

        var result = farms.Select(f =>
        {
            var primaryLand = f.LandDetails.FirstOrDefault();
            return new FarmListItemDto
            {
                Id = f.Id,
                FarmName = f.FarmName,
                SurveyNumber = primaryLand?.SurveyNumber ?? "N/A",
                LandType = primaryLand?.LandType ?? "Agricultural",
                FarmerId = f.FarmerId,
                FarmerName = f.Farmer?.FullName ?? "Unknown Farmer",
                LandArea = primaryLand?.LandArea ?? 0,
                AreaUnit = primaryLand?.AreaUnit ?? "Acres",
                Village = f.Village,
                Mandal = f.Mandal,
                District = f.District,
                OwnershipType = f.OwnershipType,
                IrrigationType = primaryLand?.IrrigationSource?.Name ?? "N/A",
                SoilType = primaryLand?.SoilType?.Name ?? "N/A",
                Status = f.Status,
                CreatedAt = f.CreatedAt
            };
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Gets full farm details including all associated land parcels and documents
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<FarmDetailDto>> GetFarmById(int id)
    {
        var farm = await _context.Farms
            .Include(f => f.Farmer)
            .Include(f => f.LandDetails)
                .ThenInclude(ld => ld.IrrigationSource)
            .Include(f => f.LandDetails)
                .ThenInclude(ld => ld.SoilType)
            .Include(f => f.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farm == null)
        {
            return NotFound(new { message = $"Farm with ID {id} not found." });
        }

        var dto = new FarmDetailDto
        {
            Id = farm.Id,
            FarmerId = farm.FarmerId,
            FarmerName = farm.Farmer?.FullName ?? "Unknown",
            FarmName = farm.FarmName,
            OwnershipType = farm.OwnershipType,
            Village = farm.Village,
            Mandal = farm.Mandal,
            District = farm.District,
            State = farm.State,
            Pincode = farm.Pincode,
            Status = farm.Status,
            CreatedAt = farm.CreatedAt,
            UpdatedAt = farm.UpdatedAt,
            LandDetails = farm.LandDetails.Select(ld => new LandDetailDto
            {
                Id = ld.Id,
                FarmId = ld.FarmId,
                FarmName = farm.FarmName,
                SurveyNumber = ld.SurveyNumber,
                LandArea = ld.LandArea,
                AreaUnit = ld.AreaUnit,
                LandType = ld.LandType,
                IrrigationSourceId = ld.IrrigationSourceId,
                IrrigationSourceName = ld.IrrigationSource?.Name ?? "N/A",
                SoilTypeId = ld.SoilTypeId,
                SoilTypeName = ld.SoilType?.Name ?? "N/A",
                BoundariesNorth = ld.BoundariesNorth,
                BoundariesSouth = ld.BoundariesSouth,
                BoundariesEast = ld.BoundariesEast,
                BoundariesWest = ld.BoundariesWest,
                Remarks = ld.Remarks,
                CreatedAt = ld.CreatedAt,
                UpdatedAt = ld.UpdatedAt
            }).ToList(),
            Documents = farm.Documents.Select(d => new FarmDocumentDto
            {
                Id = d.Id,
                FarmId = d.FarmId,
                DocumentType = d.DocumentType,
                DocumentNumber = d.DocumentNumber,
                FileName = d.FileName,
                FileUrl = d.FileUrl,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Gets all farms and lands for a specific farmer (Demonstrating: Farmer can have multiple lands)
    /// </summary>
    [HttpGet("farmer/{farmerId:int}")]
    public async Task<ActionResult<FarmerWithLandsDto>> GetFarmsByFarmer(int farmerId)
    {
        var farmer = await _context.Farmers
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
                    .ThenInclude(ld => ld.IrrigationSource)
            .Include(f => f.Farms)
                .ThenInclude(farm => farm.LandDetails)
                    .ThenInclude(ld => ld.SoilType)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == farmerId);

        if (farmer == null)
        {
            return NotFound(new { message = $"Farmer with ID {farmerId} not found." });
        }

        var result = new FarmerWithLandsDto
        {
            FarmerId = farmer.Id,
            FarmerName = farmer.FullName,
            PhoneNumber = farmer.PhoneNumber,
            Village = farmer.Village,
            Mandal = farmer.Mandal,
            District = farmer.District,
            Farms = farmer.Farms.Select(farm => new FarmerFarmSummaryDto
            {
                FarmId = farm.Id,
                FarmName = farm.FarmName,
                OwnershipType = farm.OwnershipType,
                Village = farm.Village,
                Mandal = farm.Mandal,
                District = farm.District,
                Status = farm.Status,
                Lands = farm.LandDetails.Select(ld => new LandDetailDto
                {
                    Id = ld.Id,
                    FarmId = ld.FarmId,
                    FarmName = farm.FarmName,
                    SurveyNumber = ld.SurveyNumber,
                    LandArea = ld.LandArea,
                    AreaUnit = ld.AreaUnit,
                    LandType = ld.LandType,
                    IrrigationSourceId = ld.IrrigationSourceId,
                    IrrigationSourceName = ld.IrrigationSource?.Name ?? "N/A",
                    SoilTypeId = ld.SoilTypeId,
                    SoilTypeName = ld.SoilType?.Name ?? "N/A",
                    BoundariesNorth = ld.BoundariesNorth,
                    BoundariesSouth = ld.BoundariesSouth,
                    BoundariesEast = ld.BoundariesEast,
                    BoundariesWest = ld.BoundariesWest,
                    Remarks = ld.Remarks,
                    CreatedAt = ld.CreatedAt
                }).ToList()
            }).ToList()
        };

        return Ok(result);
    }

    /// <summary>
    /// Creates a new Farm along with its initial land details in an atomic transaction
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FarmDetailDto>> CreateFarm([FromBody] CreateFarmRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var farmerExists = await _context.Farmers.AnyAsync(f => f.Id == request.FarmerId);
        if (!farmerExists)
        {
            return BadRequest(new { message = $"Farmer with ID {request.FarmerId} does not exist." });
        }

        try
        {
            var farm = new Farm
            {
                FarmerId = request.FarmerId,
                FarmName = request.FarmName.Trim(),
                OwnershipType = request.OwnershipType.Trim(),
                Village = request.Village.Trim(),
                Mandal = request.Mandal.Trim(),
                District = request.District.Trim(),
                State = string.IsNullOrWhiteSpace(request.State) ? "Andhra Pradesh" : request.State.Trim(),
                Pincode = request.Pincode?.Trim(),
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            var irrigationSourceId = (request.IrrigationSourceId.HasValue && request.IrrigationSourceId.Value > 0)
                ? request.IrrigationSourceId
                : null;

            var soilTypeId = (request.SoilTypeId.HasValue && request.SoilTypeId.Value > 0)
                ? request.SoilTypeId
                : null;

            var landDetail = new FarmLandDetail
            {
                SurveyNumber = request.SurveyNumber.Trim(),
                LandArea = request.LandArea,
                AreaUnit = request.AreaUnit.Trim(),
                LandType = request.LandType.Trim(),
                IrrigationSourceId = irrigationSourceId,
                SoilTypeId = soilTypeId,
                BoundariesNorth = string.IsNullOrWhiteSpace(request.BoundariesNorth) ? null : request.BoundariesNorth.Trim(),
                BoundariesSouth = string.IsNullOrWhiteSpace(request.BoundariesSouth) ? null : request.BoundariesSouth.Trim(),
                BoundariesEast = string.IsNullOrWhiteSpace(request.BoundariesEast) ? null : request.BoundariesEast.Trim(),
                BoundariesWest = string.IsNullOrWhiteSpace(request.BoundariesWest) ? null : request.BoundariesWest.Trim(),
                Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            farm.LandDetails.Add(landDetail);
            _context.Farms.Add(farm);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFarmById), new { id = farm.Id }, await GetFarmDto(farm.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating farm with details");
            return StatusCode(500, new { message = "An error occurred while creating the farm record.", error = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing Farm and its primary land parcel
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<FarmDetailDto>> UpdateFarm(int id, [FromBody] UpdateFarmRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var farm = await _context.Farms
            .Include(f => f.LandDetails)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (farm == null)
        {
            return NotFound(new { message = $"Farm with ID {id} not found." });
        }

        var farmerExists = await _context.Farmers.AnyAsync(f => f.Id == request.FarmerId);
        if (!farmerExists)
        {
            return BadRequest(new { message = $"Farmer with ID {request.FarmerId} does not exist." });
        }

        farm.FarmerId = request.FarmerId;
        farm.FarmName = request.FarmName.Trim();
        farm.OwnershipType = request.OwnershipType.Trim();
        farm.Village = request.Village.Trim();
        farm.Mandal = request.Mandal.Trim();
        farm.District = request.District.Trim();
        farm.State = request.State.Trim();
        farm.Pincode = request.Pincode?.Trim();
        farm.Status = request.Status.Trim();
        farm.UpdatedAt = DateTime.UtcNow;

        // Update primary land detail
        FarmLandDetail? landDetail = null;
        if (request.LandDetailId.HasValue)
        {
            landDetail = farm.LandDetails.FirstOrDefault(ld => ld.Id == request.LandDetailId.Value);
        }
        else
        {
            landDetail = farm.LandDetails.FirstOrDefault();
        }

        if (landDetail != null)
        {
            landDetail.SurveyNumber = request.SurveyNumber.Trim();
            landDetail.LandArea = request.LandArea;
            landDetail.AreaUnit = request.AreaUnit.Trim();
            landDetail.LandType = request.LandType.Trim();
            landDetail.IrrigationSourceId = (request.IrrigationSourceId.HasValue && request.IrrigationSourceId.Value > 0) ? request.IrrigationSourceId : null;
            landDetail.SoilTypeId = (request.SoilTypeId.HasValue && request.SoilTypeId.Value > 0) ? request.SoilTypeId : null;
            landDetail.BoundariesNorth = request.BoundariesNorth?.Trim();
            landDetail.BoundariesSouth = request.BoundariesSouth?.Trim();
            landDetail.BoundariesEast = request.BoundariesEast?.Trim();
            landDetail.BoundariesWest = request.BoundariesWest?.Trim();
            landDetail.Remarks = request.Remarks?.Trim();
            landDetail.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // If farm had no land details yet, create one
            var newLand = new FarmLandDetail
            {
                FarmId = farm.Id,
                SurveyNumber = request.SurveyNumber.Trim(),
                LandArea = request.LandArea,
                AreaUnit = request.AreaUnit.Trim(),
                LandType = request.LandType.Trim(),
                IrrigationSourceId = (request.IrrigationSourceId.HasValue && request.IrrigationSourceId.Value > 0) ? request.IrrigationSourceId : null,
                SoilTypeId = (request.SoilTypeId.HasValue && request.SoilTypeId.Value > 0) ? request.SoilTypeId : null,
                BoundariesNorth = request.BoundariesNorth?.Trim(),
                BoundariesSouth = request.BoundariesSouth?.Trim(),
                BoundariesEast = request.BoundariesEast?.Trim(),
                BoundariesWest = request.BoundariesWest?.Trim(),
                Remarks = request.Remarks?.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.FarmLandDetails.Add(newLand);
        }

        await _context.SaveChangesAsync();

        return Ok(await GetFarmDto(farm.Id));
    }

    /// <summary>
    /// Deletes a Farm and cascaded land details and documents
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteFarm(int id)
    {
        var farm = await _context.Farms.FindAsync(id);
        if (farm == null)
        {
            return NotFound(new { message = $"Farm with ID {id} not found." });
        }

        _context.Farms.Remove(farm);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Farm '{farm.FarmName}' with ID {id} was deleted successfully." });
    }

    private async Task<FarmDetailDto> GetFarmDto(int farmId)
    {
        var farm = await _context.Farms
            .Include(f => f.Farmer)
            .Include(f => f.LandDetails).ThenInclude(ld => ld.IrrigationSource)
            .Include(f => f.LandDetails).ThenInclude(ld => ld.SoilType)
            .Include(f => f.Documents)
            .AsNoTracking()
            .FirstAsync(f => f.Id == farmId);

        return new FarmDetailDto
        {
            Id = farm.Id,
            FarmerId = farm.FarmerId,
            FarmerName = farm.Farmer?.FullName ?? "Unknown",
            FarmName = farm.FarmName,
            OwnershipType = farm.OwnershipType,
            Village = farm.Village,
            Mandal = farm.Mandal,
            District = farm.District,
            State = farm.State,
            Pincode = farm.Pincode,
            Status = farm.Status,
            CreatedAt = farm.CreatedAt,
            UpdatedAt = farm.UpdatedAt,
            LandDetails = farm.LandDetails.Select(ld => new LandDetailDto
            {
                Id = ld.Id,
                FarmId = ld.FarmId,
                FarmName = farm.FarmName,
                SurveyNumber = ld.SurveyNumber,
                LandArea = ld.LandArea,
                AreaUnit = ld.AreaUnit,
                LandType = ld.LandType,
                IrrigationSourceId = ld.IrrigationSourceId,
                IrrigationSourceName = ld.IrrigationSource?.Name ?? "N/A",
                SoilTypeId = ld.SoilTypeId,
                SoilTypeName = ld.SoilType?.Name ?? "N/A",
                BoundariesNorth = ld.BoundariesNorth,
                BoundariesSouth = ld.BoundariesSouth,
                BoundariesEast = ld.BoundariesEast,
                BoundariesWest = ld.BoundariesWest,
                Remarks = ld.Remarks,
                CreatedAt = ld.CreatedAt,
                UpdatedAt = ld.UpdatedAt
            }).ToList(),
            Documents = farm.Documents.Select(d => new FarmDocumentDto
            {
                Id = d.Id,
                FarmId = d.FarmId,
                DocumentType = d.DocumentType,
                DocumentNumber = d.DocumentNumber,
                FileName = d.FileName,
                FileUrl = d.FileUrl,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt
            }).ToList()
        };
    }
}
