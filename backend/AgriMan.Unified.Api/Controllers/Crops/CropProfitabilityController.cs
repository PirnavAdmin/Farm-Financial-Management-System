using System.Text;
using AgriMan.Unified.Api.DTOs.Crops;
using AgriMan.Unified.Api.Services.Crops;
using Microsoft.AspNetCore.Mvc;

namespace AgriMan.Unified.Api.Controllers.Crops;

/// <summary>
/// Core AgriMan Crop Profitability, P&amp;L, and Unit Economics API.
/// Computes per-crop Income, Expense Breakdown (Seeds, Fertilizer, Pesticides, Labour, Diesel, Machinery, Transport),
/// Net Profit (Total Income - Total Expenses), and Important Metrics (Cost/Acre, Income/Acre, Profit/Acre, Cost/Kg, Selling Price/Kg, ROI %).
/// </summary>
[ApiController]
[Route("api/crop-profitability")]
[Route("api/v1/crop-profitability")]
[Tags("05. Crops - Crop Profiles, Categories, Varieties & Seasons (Module 5)")]
[Produces("application/json")]
public class CropProfitabilityController : ControllerBase
{
    private readonly ICropProfitabilityService _service;
    private readonly ILogger<CropProfitabilityController> _logger;

    public CropProfitabilityController(
        ICropProfitabilityService service,
        ILogger<CropProfitabilityController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get complete Crop P&amp;L and unit-economic metrics for every crop.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CropProfitabilityOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CropProfitabilityOverviewDto>> GetAll(
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _service.GetAllCropsProfitabilityAsync(parameters, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get Crop P&amp;L and unit-economic metrics for a specific crop by name (e.g., Cotton).
    /// </summary>
    [HttpGet("{cropName}")]
    [ProducesResponseType(typeof(CropProfitabilityItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CropProfitabilityItemDto>> GetByCropName(
        string cropName,
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cropName))
        {
            return BadRequest(new { message = "Crop name is required." });
        }

        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var item = await _service.GetCropProfitabilityByNameAsync(cropName, parameters, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"No crop profitability data found for '{cropName.Trim()}'." });
        }

        return Ok(item);
    }

    /// <summary>
    /// Get Crop P&amp;L and unit-economic metrics for a specific crop by master Crop ID.
    /// </summary>
    [HttpGet("by-id/{cropId:int}")]
    [ProducesResponseType(typeof(CropProfitabilityItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CropProfitabilityItemDto>> GetByCropId(
        int cropId,
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (cropId <= 0)
        {
            return BadRequest(new { message = "cropId must be greater than zero." });
        }

        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var item = await _service.GetCropProfitabilityByIdAsync(cropId, parameters, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = $"Crop with ID {cropId} was not found." });
        }

        return Ok(item);
    }

    /// <summary>
    /// Stateless Crop P&amp;L and ROI calculator for a given crop scenario (does not modify database data).
    /// </summary>
    [HttpPost("calculate")]
    [ProducesResponseType(typeof(CropProfitabilityItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<CropProfitabilityItemDto> Calculate([FromBody] CropProfitabilityCalculationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (string.IsNullOrWhiteSpace(request.Crop))
        {
            return BadRequest(new { message = "Crop name is required." });
        }

        _logger.LogDebug("Calculating crop profitability scenario for {Crop}", request.Crop);
        var result = _service.CalculateScenario(request);
        return Ok(result);
    }

    /// <summary>
    /// Export Crop Profitability and Unit Economics report as CSV.
    /// </summary>
    [HttpGet("export/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] CropProfitabilityQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue &&
            parameters.FromDate.Value.Date > parameters.ToDate.Value.Date)
        {
            return BadRequest(new { message = "fromDate cannot be later than toDate." });
        }

        var csv = await _service.ExportCsvAsync(parameters, cancellationToken);
        var bytes = Encoding.UTF8.GetBytes(csv);
        var fileName = $"agriman_crop_profitability_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv", fileName);
    }
}
