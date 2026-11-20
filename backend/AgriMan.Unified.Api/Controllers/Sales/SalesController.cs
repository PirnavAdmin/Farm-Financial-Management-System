using System.Text;
using AgriMan.Api.Services;
using Microsoft.AspNetCore.Mvc;
using SalesApi.Data;
using SalesApi.DTOs;
using SalesApi.Services;

namespace SalesApi.Controllers;

/// <summary>
/// Module 10 - Sales Management API: Sales transactions, line items (SalesItems),
/// payments, receivables, analytics, and CSV exports.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesController : ControllerBase
{
    private readonly ISalesService _salesService;
    private readonly SalesDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ILogger<SalesController> _logger;

    public SalesController(
        ISalesService salesService,
        SalesDbContext context,
        IAuditService auditService,
        ILogger<SalesController> logger)
    {
        _salesService = salesService;
        _context = context;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of sales records with search, status, buyer, crop, farm, date range, and sorting.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SaleResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<SaleResponseDto>>> GetAll([FromQuery] SaleQueryParameters query)
    {
        var result = await _salesService.GetSalesAsync(query);
        return Ok(result);
    }

    /// <summary>
    /// Get single sales record by ID including its line items and payments.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> GetById(int id)
    {
        var sale = await _salesService.GetSaleByIdAsync(id);
        if (sale == null)
            return NotFound(new { message = $"Sales record with ID {id} not found." });

        return Ok(sale);
    }

    /// <summary>
    /// Get single sales record by Sales Number (e.g. SAL-2026-001).
    /// </summary>
    [HttpGet("by-number/{salesNo}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> GetBySalesNo(string salesNo)
    {
        var sale = await _salesService.GetSaleByNoAsync(salesNo);
        if (sale == null)
            return NotFound(new { message = $"Sales record with SalesNo '{salesNo}' not found." });

        return Ok(sale);
    }

    /// <summary>
    /// Get sales KPI summary (total gross, commission, transport, net, collected vs outstanding, status counts).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(SaleSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SaleSummaryDto>> GetSummary()
    {
        var summary = await _salesService.GetSalesSummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Get detailed sales analytics grouped by Crop, Buyer, Farm, and Month.
    /// </summary>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(SalesAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SalesAnalyticsDto>> GetAnalytics(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var analytics = await _salesService.GetSalesAnalyticsAsync(fromDate, toDate);
        return Ok(analytics);
    }

    /// <summary>
    /// Get sales receivables overview (Total Sales, Amount Received, Outstanding Balance, Payment Status per sale).
    /// </summary>
    [HttpGet("receivables")]
    [ProducesResponseType(typeof(ReceivablesOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ReceivablesOverviewDto>> GetReceivables(
        [FromQuery] string? search = null,
        [FromQuery] string? buyer = null,
        [FromQuery] string? status = null)
    {
        var overview = await _salesService.GetReceivablesAsync(search, buyer, status);
        return Ok(overview);
    }

    /// <summary>
    /// Sync or settle a receivable entry directly by Sales Number.
    /// </summary>
    [HttpPut("receivables/{salesNo}")]
    [ProducesResponseType(typeof(ReceivableItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReceivableItemDto>> SyncReceivable(string salesNo, [FromBody] SyncReceivableDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.SyncReceivableAsync(salesNo, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("UpdateReceivable", "Sale", salesNo, $"AmountReceived={dto.AmountReceived}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Export filtered sales records as a CSV file.
    /// </summary>
    [HttpGet("export")]
    [Produces("text/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] SaleQueryParameters query)
    {
        var csv = await _salesService.ExportSalesCsvAsync(query);
        var bytes = Encoding.UTF8.GetBytes(csv);
        var fileName = $"agriman_sales_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Create a new sales record with automatic Gross/Net calculation, SalesItems creation, and optional initial payment.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SaleResponseDto>> Create([FromBody] CreateSaleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.CreateSaleAsync(dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Create", "Sale", result.Data!.SalesNo, $"NetAmount={result.Data.NetAmount}, Buyer={result.Data.Buyer}");
        return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing sales record and synchronize its SalesItems and PaymentStatus.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> Update(int id, [FromBody] UpdateSaleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdateSaleAsync(id, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Update", "Sale", result.Data!.SalesNo, $"NetAmount={result.Data.NetAmount}, Status={result.Data.PaymentStatus}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Update the PaymentStatus of a sales record.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> UpdateStatus(int id, [FromBody] UpdateSaleStatusDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdateSaleStatusAsync(id, dto.PaymentStatus);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("UpdateStatus", "Sale", result.Data!.SalesNo, $"PaymentStatus={result.Data.PaymentStatus}");
        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a sales record along with its associated SalesItems and SalesPayments.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _salesService.DeleteSaleAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Delete", "Sale", id.ToString(), "Deleted sale and linked items/payments");
        return NoContent();
    }

    // -------------------------------------------------------------------------
    // NESTED SALES ITEMS ENDPOINTS (`SalesItems`)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Get all line items for a specific sale.
    /// </summary>
    [HttpGet("{id:int}/items")]
    [ProducesResponseType(typeof(List<SalesItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SalesItemDto>>> GetItems(int id)
    {
        var result = await _salesService.GetSaleItemsAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Add a line item to an existing sale and recalculate Gross/Net amounts.
    /// </summary>
    [HttpPost("{id:int}/items")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> AddItem(int id, [FromBody] CreateSalesItemDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.AddSaleItemAsync(id, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return StatusCode(StatusCodes.Status201Created, result.Data);
    }

    /// <summary>
    /// Update a specific line item of a sale and recalculate Gross/Net amounts.
    /// </summary>
    [HttpPut("{id:int}/items/{itemId:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> UpdateItem(int id, int itemId, [FromBody] UpdateSalesItemDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _salesService.UpdateSaleItemAsync(id, itemId, dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Remove a line item from a sale and recalculate Gross/Net amounts.
    /// </summary>
    [HttpDelete("{id:int}/items/{itemId:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> DeleteItem(int id, int itemId)
    {
        var result = await _salesService.DeleteSaleItemAsync(id, itemId);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    // -------------------------------------------------------------------------
    // NESTED SALES PAYMENTS ENDPOINTS (`SalesPayments`)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Get all payments recorded against a specific sale ID.
    /// </summary>
    [HttpGet("{id:int}/payments")]
    [ProducesResponseType(typeof(List<SalesPaymentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SalesPaymentResponseDto>>> GetSalePayments(int id)
    {
        var sale = await _salesService.GetSaleByIdAsync(id);
        if (sale == null)
            return NotFound(new { message = $"Sales record with ID {id} not found." });

        return Ok(sale.Payments);
    }

    /// <summary>
    /// Record a payment directly against a specific sale ID and automatically update PaymentStatus.
    /// </summary>
    [HttpPost("{id:int}/payments")]
    [ProducesResponseType(typeof(SalesPaymentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SalesPaymentResponseDto>> AddSalePayment(int id, [FromBody] CreateSalesPaymentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        dto.SaleId = id;
        var result = await _salesService.CreatePaymentAsync(dto);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        await TryAuditAsync("Create", "SalesPayment", result.Data!.PaymentNo, $"SaleId={id}, Amount={result.Data.PaymentAmount}");
        return StatusCode(StatusCodes.Status201Created, result.Data);
    }

    /// <summary>
    /// Seed default Buyers, Sales, SalesItems, and SalesPayments if tables are empty.
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Seed()
    {
        var (buyers, sales, items, payments) = await SalesDbInitializer.SeedInitialDataAsync(_context, _logger);
        return Ok(new
        {
            message = buyers + sales + items + payments > 0
                ? "Successfully seeded initial Module 10 Sales records."
                : "Database already contains Module 10 Sales records. No seed performed.",
            buyersSeeded = buyers,
            salesSeeded = sales,
            salesItemsSeeded = items,
            salesPaymentsSeeded = payments
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
