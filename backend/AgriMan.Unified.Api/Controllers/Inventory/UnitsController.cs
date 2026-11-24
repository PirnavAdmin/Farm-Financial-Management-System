using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using FarmManagementApi.DTOs;
using FarmManagementApi.Services;
using AgriMan.Api.Services;

namespace FarmManagementApi.Controllers;

/// <summary>
/// API endpoints for managing Units of Measurement (kg, Bags, Litre, Quintals, Packets, etc.).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class UnitsController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IAuditService _auditService;

    public UnitsController(
        IInventoryService inventoryService,
        IAuditService auditService)
    {
        _inventoryService = inventoryService;
        _auditService = auditService;
    }

    /// <summary>
    /// Get all measurement units with optional active status and search filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<UnitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive, [FromQuery] string? search)
    {
        var result = await _inventoryService.GetUnitsAsync(isActive, search);
        return Ok(result.Data);
    }

    /// <summary>
    /// Get a unit of measurement by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _inventoryService.GetUnitByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new unit of measurement.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUnitDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.CreateUnitAsync(dto, actorId, actorName, ip);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing unit of measurement.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UnitDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUnitDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateUnitAsync(id, dto, actorId, actorName, ip);
        if (!result.Success)
        {
            if (result.StatusCode == 404)
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Delete or deactivate a unit. Blocked if linked to active products.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.DeleteUnitAsync(id, actorId, actorName, ip);
        if (!result.Success)
        {
            if (result.StatusCode == 404)
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { success = true, message = result.Message });
    }
}
