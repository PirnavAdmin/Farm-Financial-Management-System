using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;

namespace FarmManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MastersController : ControllerBase
{
    private readonly FarmDbContext _context;

    public MastersController(FarmDbContext context)
    {
        _context = context;
    }

    [HttpGet("irrigation-sources")]
    public async Task<ActionResult<IEnumerable<LookupItemDto>>> GetIrrigationSources()
    {
        var sources = await _context.IrrigationSources
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new LookupItemDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description
            })
            .ToListAsync();

        return Ok(sources);
    }

    [HttpGet("soil-types")]
    public async Task<ActionResult<IEnumerable<LookupItemDto>>> GetSoilTypes()
    {
        var soils = await _context.SoilTypes
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new LookupItemDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description
            })
            .ToListAsync();

        return Ok(soils);
    }

    [HttpGet("area-units")]
    public ActionResult<IEnumerable<string>> GetAreaUnits()
    {
        var units = new[] { "Acres", "Hectares", "Cents", "Square Feet", "Gunthas" };
        return Ok(units);
    }

    [HttpGet("ownership-types")]
    public ActionResult<IEnumerable<string>> GetOwnershipTypes()
    {
        var types = new[] { "Owned", "Leased", "Shared" };
        return Ok(types);
    }

    [HttpGet("land-types")]
    public ActionResult<IEnumerable<string>> GetLandTypes()
    {
        var types = new[] { "Agricultural", "Wet Land", "Dry Land", "Commercial" };
        return Ok(types);
    }

    [HttpGet("statuses")]
    public ActionResult<IEnumerable<string>> GetStatuses()
    {
        var statuses = new[] { "Active", "Inactive" };
        return Ok(statuses);
    }
}
