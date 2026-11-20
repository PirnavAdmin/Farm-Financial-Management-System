using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;
using SalesApi.DTOs;
using SalesApi.Services;

namespace SalesApi.Controllers;

/// <summary>
/// Module 10 - Sales Payments and Receivables API (`SalesPayments` table).
/// Automatically synchronizes parent Sale PaymentStatus (Pending / Partially Paid / Paid).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesPaymentsController : ControllerBase
{
    private readonly ISalesService _salesService;
    private readonly IAuditService _auditService;
    private readonly ILogger<SalesPaymentsController> _logger;

    public SalesPaymentsController(
        ISalesService salesService,
        IAuditService auditService,
        ILogger<SalesPaymentsController> logger)
    {
        _salesService = salesService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get all sales payment vouchers with optional search, buyer, salesNo, paymentMode, and date filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SalesPaymentResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SalesPaymentResponseDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? buyer,
        [FromQuery] string? salesNo,
        [FromQuery] string? paymentMode,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var payments = await _salesService.GetPaymentsAsync(search, buyer, salesNo, paymentMode, fromDate, toDate);
        return Ok(payments);
    }

    /// <summary>
    /// Get a single sales payment voucher by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SalesPaymentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SalesPaymentResponseDto>> GetById(int id)
    {
        var payment = await _salesService.GetPaymentByIdAsync(id);
        if (payment == null)
            return NotFound(new { message = $"Payment record with ID {id} not found." });

        return Ok(payment);
    }

    /// <summary>
    /// Get payment collection summary and breakdown by payment mode (Cash, Bank, UPI, etc.).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(SalesPaymentSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SalesPaymentSummaryDto>> GetSummary()
    {
        var summary = await _salesService.GetPaymentsSummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Record a new sales payment voucher and automatically recalculate the parent Sale PaymentStatus.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SalesPaymentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SalesPaymentResponseDto>> Create([FromBody] CreateSalesPaymentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.CreatePaymentAsync(dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Create", "SalesPayment", result.Data!.PaymentNo,
            $"SalesNo={result.Data.SalesNo}, Amount={result.Data.PaymentAmount}, Mode={result.Data.PaymentMode}");
        return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing payment voucher and recalculate the parent Sale PaymentStatus.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SalesPaymentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SalesPaymentResponseDto>> Update(int id, [FromBody] UpdateSalesPaymentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdatePaymentAsync(id, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Update", "SalesPayment", result.Data!.PaymentNo,
            $"SalesNo={result.Data.SalesNo}, Amount={result.Data.PaymentAmount}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a sales payment voucher and automatically recalculate the parent Sale PaymentStatus.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _salesService.DeletePaymentAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Delete", "SalesPayment", id.ToString(), "Deleted sales payment voucher");
        return NoContent();
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
