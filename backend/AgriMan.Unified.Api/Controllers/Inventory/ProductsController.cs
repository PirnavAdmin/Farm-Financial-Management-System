using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using FarmManagementApi.DTOs;
using FarmManagementApi.Services;
using AgriMan.Api.Services;

namespace FarmManagementApi.Controllers;

/// <summary>
/// API endpoints for managing Products, Agricultural Inputs, and Inventory Master.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IAuditService _auditService;

    public ProductsController(
        IInventoryService inventoryService,
        IAuditService auditService)
    {
        _inventoryService = inventoryService;
        _auditService = auditService;
    }

    /// <summary>
    /// Get paginated list of products with optional category, unit, active status, and search filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedProductsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] int? unitId,
        [FromQuery] bool? isActive,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _inventoryService.GetProductsAsync(categoryId, unitId, isActive, search, page, pageSize);
        return Ok(result.Data);
    }

    /// <summary>
    /// Get next available collision-free sequential product code (PRD-NNN).
    /// </summary>
    [HttpGet("next-code")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextCode()
    {
        var code = await _inventoryService.GenerateNextProductCodeAsync();
        return Ok(new { nextCode = code, code });
    }

    /// <summary>
    /// Get product by ID with category details and current stock.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _inventoryService.GetProductByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new product. If Code is omitted, automatically assigns sequential PRD-NNN.
    /// Validates CategoryId and UnitId existence, and ensures ReorderLevel and StandardCost are non-negative.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.CreateProductAsync(dto, actorId, actorName, ip);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing product. Validates CategoryId and UnitId, and ensures non-negative numbers.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateProductAsync(id, dto, actorId, actorName, ip);
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
    /// Update active status of a product (activate / deactivate).
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateProductStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateProductStatusAsync(id, dto.IsActive, actorId, actorName, ip);
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
    /// Soft delete (deactivate) a product to maintain relational integrity with transactions and purchases.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.DeleteProductAsync(id, actorId, actorName, ip);
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
