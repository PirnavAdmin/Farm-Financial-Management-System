using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmLandDetailsController : ControllerBase
{
    private readonly FarmDbContext _context;

    public FarmLandDetailsController(FarmDbContext context)
    {
        _context = context;
    }

    [HttpGet("farm/{farmId:int}")]
    public async Task<ActionResult<IEnumerable<LandDetailDto>>> GetLandDetailsByFarm(int farmId)
    {
        var lands = await _context.FarmLandDetails
            .Include(ld => ld.Farm)
            .Include(ld => ld.IrrigationSource)
            .Include(ld => ld.SoilType)
            .Where(ld => ld.FarmId == farmId)
            .AsNoTracking()
            .ToListAsync();

        var result = lands.Select(ld => new LandDetailDto
        {
            Id = ld.Id,
            FarmId = ld.FarmId,
            FarmName = ld.Farm?.FarmName ?? "",
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
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LandDetailDto>> GetLandDetailById(int id)
    {
        var ld = await _context.FarmLandDetails
            .Include(l => l.Farm)
            .Include(l => l.IrrigationSource)
            .Include(l => l.SoilType)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (ld == null)
        {
            return NotFound(new { message = $"Land detail with ID {id} not found." });
        }

        var dto = new LandDetailDto
        {
            Id = ld.Id,
            FarmId = ld.FarmId,
            FarmName = ld.Farm?.FarmName ?? "",
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
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<LandDetailDto>> AddLandDetail([FromBody] CreateLandDetailRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var farm = await _context.Farms.FindAsync(request.FarmId);
        if (farm == null)
        {
            return BadRequest(new { message = $"Farm with ID {request.FarmId} does not exist." });
        }

        var land = new FarmLandDetail
        {
            FarmId = request.FarmId,
            SurveyNumber = request.SurveyNumber.Trim(),
            LandArea = request.LandArea,
            AreaUnit = request.AreaUnit.Trim(),
            LandType = request.LandType.Trim(),
            IrrigationSourceId = (request.IrrigationSourceId.HasValue && request.IrrigationSourceId.Value > 0) ? request.IrrigationSourceId : null,
            SoilTypeId = (request.SoilTypeId.HasValue && request.SoilTypeId.Value > 0) ? request.SoilTypeId : null,
            BoundariesNorth = string.IsNullOrWhiteSpace(request.BoundariesNorth) ? null : request.BoundariesNorth.Trim(),
            BoundariesSouth = string.IsNullOrWhiteSpace(request.BoundariesSouth) ? null : request.BoundariesSouth.Trim(),
            BoundariesEast = string.IsNullOrWhiteSpace(request.BoundariesEast) ? null : request.BoundariesEast.Trim(),
            BoundariesWest = string.IsNullOrWhiteSpace(request.BoundariesWest) ? null : request.BoundariesWest.Trim(),
            Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.FarmLandDetails.Add(land);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLandDetailById), new { id = land.Id }, new LandDetailDto
        {
            Id = land.Id,
            FarmId = land.FarmId,
            FarmName = farm.FarmName,
            SurveyNumber = land.SurveyNumber,
            LandArea = land.LandArea,
            AreaUnit = land.AreaUnit,
            LandType = land.LandType,
            IrrigationSourceId = land.IrrigationSourceId,
            SoilTypeId = land.SoilTypeId,
            BoundariesNorth = land.BoundariesNorth,
            BoundariesSouth = land.BoundariesSouth,
            BoundariesEast = land.BoundariesEast,
            BoundariesWest = land.BoundariesWest,
            Remarks = land.Remarks,
            CreatedAt = land.CreatedAt
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateLandDetail(int id, [FromBody] UpdateLandDetailRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var land = await _context.FarmLandDetails.FindAsync(id);
        if (land == null)
        {
            return NotFound(new { message = $"Land detail with ID {id} not found." });
        }

        land.SurveyNumber = request.SurveyNumber.Trim();
        land.LandArea = request.LandArea;
        land.AreaUnit = request.AreaUnit.Trim();
        land.LandType = request.LandType.Trim();
        land.IrrigationSourceId = (request.IrrigationSourceId.HasValue && request.IrrigationSourceId.Value > 0) ? request.IrrigationSourceId : null;
        land.SoilTypeId = (request.SoilTypeId.HasValue && request.SoilTypeId.Value > 0) ? request.SoilTypeId : null;
        land.BoundariesNorth = request.BoundariesNorth?.Trim();
        land.BoundariesSouth = request.BoundariesSouth?.Trim();
        land.BoundariesEast = request.BoundariesEast?.Trim();
        land.BoundariesWest = request.BoundariesWest?.Trim();
        land.Remarks = request.Remarks?.Trim();
        land.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLandDetail(int id)
    {
        var land = await _context.FarmLandDetails.FindAsync(id);
        if (land == null)
        {
            return NotFound(new { message = $"Land detail with ID {id} not found." });
        }

        _context.FarmLandDetails.Remove(land);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Survey {land.SurveyNumber} removed successfully." });
    }
}
