using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using FarmManagementApi.DTOs;
using FarmManagementApi.Services;
using AgriMan.Api.Services;

namespace FarmManagementApi.Controllers;

/// <summary>
/// API endpoints for managing Product Categories (Seeds, Fertilizers, Pesticides, etc.).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Route("api/product-categories")]
[Route("api/v1/product-categories")]
[Produces("application/json")]
public class ProductCategoriesController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IAuditService _auditService;

    public ProductCategoriesController(
        IInventoryService inventoryService,
        IAuditService auditService)
    {
        _inventoryService = inventoryService;
        _auditService = auditService;
    }

    /// <summary>
    /// Get all product categories with optional active status and search filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProductCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive, [FromQuery] string? search)
    {
        var result = await _inventoryService.GetCategoriesAsync(isActive, search);
        return Ok(result.Data);
    }

    /// <summary>
    /// Get a product category by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _inventoryService.GetCategoryByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(new { message = result.Message });
        }
        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new product category.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductCategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductCategoryDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.CreateCategoryAsync(dto, actorId, actorName, ip);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing product category.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ProductCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductCategoryDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.UpdateCategoryAsync(id, dto, actorId, actorName, ip);
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
    /// Delete or deactivate a product category. Blocked if linked to active products.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var (actorId, actorName) = _auditService.GetActorFromPrincipal(User);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _inventoryService.DeleteCategoryAsync(id, actorId, actorName, ip);
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
