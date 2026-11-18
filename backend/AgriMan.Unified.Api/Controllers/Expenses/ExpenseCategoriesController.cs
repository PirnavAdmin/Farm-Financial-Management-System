using AgriMan.Expenses.Api.Data;
using AgriMan.Expenses.Api.DTOs;
using AgriMan.Expenses.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriMan.Expenses.Api.Controllers;

/// <summary>
/// API endpoints for managing Farm Expense Categories (Fertilizers, Labour, Seeds, Machinery, Fuel, etc.).
/// </summary>
[ApiController]
[Route("api/expense-categories")]
[Route("api/v1/expense-categories")]
[Route("api/v1/categories")]
[Produces("application/json")]
public class ExpenseCategoriesController : ControllerBase
{
    private readonly ExpenseDbContext _context;

    public ExpenseCategoriesController(ExpenseDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all active expense categories with usage counts.
    /// </summary>
    /// <response code="200">List of expense categories</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ExpenseCategoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ExpenseCategoryDto>>> GetAll([FromQuery] bool activeOnly = true)
    {
        var query = _context.ExpenseCategories.AsNoTracking().AsQueryable();
        if (activeOnly)
        {
            query = query.Where(c => c.IsActive);
        }

        var categories = await query
            .OrderBy(c => c.Name)
            .Select(c => new ExpenseCategoryDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                ExpenseCount = c.Expenses.Count
            })
            .ToListAsync();

        return Ok(categories);
    }

    /// <summary>
    /// Get expense category by ID.
    /// </summary>
    /// <param name="id">Category ID</param>
    /// <response code="200">Category details</response>
    /// <response code="404">Category not found</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ExpenseCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExpenseCategoryDto>> GetById(int id)
    {
        var c = await _context.ExpenseCategories
            .Include(x => x.Expenses)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c == null)
        {
            return NotFound(new { message = $"Expense category with ID {id} was not found." });
        }

        return Ok(new ExpenseCategoryDto
        {
            Id = c.Id,
            Code = c.Code,
            Name = c.Name,
            Description = c.Description,
            IsActive = c.IsActive,
            ExpenseCount = c.Expenses.Count
        });
    }

    /// <summary>
    /// Create a new expense category.
    /// </summary>
    /// <param name="request">Category creation payload</param>
    /// <response code="201">Category created</response>
    /// <response code="400">Duplicate code or validation error</response>
    [HttpPost]
    [ProducesResponseType(typeof(ExpenseCategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExpenseCategoryDto>> Create([FromBody] ExpenseCategoryCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var codeUpper = request.Code.Trim().ToUpperInvariant();
        var exists = await _context.ExpenseCategories.AnyAsync(c => c.Code.ToUpper() == codeUpper);
        if (exists)
        {
            return BadRequest(new { message = $"Category code '{request.Code}' already exists." });
        }

        var entity = new ExpenseCategory
        {
            Code = codeUpper,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExpenseCategories.Add(entity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ExpenseCategoryDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            ExpenseCount = 0
        });
    }

    /// <summary>
    /// Update an existing expense category.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ExpenseCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ExpenseCategoryDto>> Update(int id, [FromBody] ExpenseCategoryUpdateRequest request)
    {
        var entity = await _context.ExpenseCategories.FindAsync(id);
        if (entity == null)
        {
            return NotFound(new { message = $"Expense category with ID {id} was not found." });
        }

        entity.Name = request.Name.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new ExpenseCategoryDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            ExpenseCount = await _context.ExpenseTransactions.CountAsync(t => t.CategoryId == id)
        });
    }

    /// <summary>
    /// Delete an expense category.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await _context.ExpenseCategories.FindAsync(id);
        if (entity == null)
        {
            return NotFound(new { message = $"Expense category with ID {id} was not found." });
        }

        _context.ExpenseCategories.Remove(entity);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Category '{entity.Name}' deleted successfully." });
    }
}
