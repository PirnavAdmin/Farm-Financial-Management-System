using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;
using SalesApi.Data;
using SalesApi.DTOs;
using SalesApi.Services;

namespace SalesApi.Controllers;

/// <summary>
/// Module 10 - Buyers / Customers Management API (`Buyers` table) with financial summary and ledger.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BuyersController : ControllerBase
{
    private readonly ISalesService _salesService;
    private readonly SalesDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ILogger<BuyersController> _logger;

    public BuyersController(
        ISalesService salesService,
        SalesDbContext context,
        IAuditService auditService,
        ILogger<BuyersController> logger)
    {
        _salesService = salesService;
        _context = context;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get list of buyers with optional search and status filters, including computed sales and outstanding balances.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<BuyerResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BuyerResponseDto>>> GetAll([FromQuery] string? search, [FromQuery] string? status)
    {
        var buyers = await _salesService.GetBuyersAsync(search, status);
        return Ok(buyers);
    }

    /// <summary>
    /// Get Buyers summary KPIs (total buyers, active/inactive counts, opening balance, total sales, receivables).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(BuyerSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BuyerSummaryDto>> GetSummary()
    {
        var summary = await _salesService.GetBuyersSummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Get a single buyer profile with financial summary by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BuyerResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuyerResponseDto>> GetById(int id)
    {
        var buyer = await _salesService.GetBuyerByIdAsync(id);
        if (buyer == null)
            return NotFound(new { message = $"Buyer with ID {id} not found." });

        return Ok(buyer);
    }

    /// <summary>
    /// Get full buyer financial ledger including associated sales and payment vouchers.
    /// </summary>
    [HttpGet("{id:int}/ledger")]
    [ProducesResponseType(typeof(BuyerLedgerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuyerLedgerDto>> GetLedger(int id)
    {
        var ledger = await _salesService.GetBuyerLedgerAsync(id);
        if (ledger == null)
            return NotFound(new { message = $"Buyer with ID {id} not found." });

        return Ok(ledger);
    }

    /// <summary>
    /// Register a new buyer / customer.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BuyerResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BuyerResponseDto>> Create([FromBody] CreateBuyerDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.CreateBuyerAsync(dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Create", "Buyer", result.Data!.BuyerCode, $"BuyerName={result.Data.BuyerName}");
        return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing buyer profile.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(BuyerResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuyerResponseDto>> Update(int id, [FromBody] UpdateBuyerDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdateBuyerAsync(id, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Update", "Buyer", result.Data!.BuyerCode, $"BuyerName={result.Data.BuyerName}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Toggle or update buyer status (Active / Inactive).
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(BuyerResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuyerResponseDto>> UpdateStatus(int id, [FromBody] UpdateBuyerStatusDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdateBuyerStatusAsync(id, dto.Status);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("UpdateStatus", "Buyer", result.Data!.BuyerCode, $"Status={result.Data.Status}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a buyer record (preserves historical sales/payments snapshots).
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _salesService.DeleteBuyerAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Delete", "Buyer", id.ToString(), "Deleted buyer record");
        return NoContent();
    }

    /// <summary>
    /// Seed default buyers if the Buyers table is empty.
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Seed()
    {
        var (buyers, _, _, _) = await SalesDbInitializer.SeedInitialDataAsync(_context, _logger);
        return Ok(new
        {
            message = buyers > 0 ? "Successfully seeded initial buyers." : "Buyers table already contains records.",
            buyersSeeded = buyers
        });
    }

    private async Task TryAuditAsync(string action, string entityType, string? entityId, string details)
    {
        try
        {
            var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditService.LogActionAsync(actorId, actorName, action, entityType, entityId, details, ip);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Non-blocking audit log skipped for {EntityType} {Action}", entityType, action);
        }
    }
}
