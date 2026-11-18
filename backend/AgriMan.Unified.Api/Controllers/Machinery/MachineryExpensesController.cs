using Agriman.Machinery.Api.Data;
using Agriman.Machinery.Api.DTOs;
using Agriman.Machinery.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agriman.Machinery.Api.Controllers;

[ApiController]
[Route("api/machinery-expenses")]
public class MachineryExpensesController : ControllerBase
{
    private readonly MachineryDbContext _db;

    public MachineryExpensesController(MachineryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<MachineryExpenseListResponse>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? expenseType,
        [FromQuery] int? machineryId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken cancellationToken)
    {
        var totalRecords = await _db.MachineryExpenses.CountAsync(cancellationToken);
        var expenseTypesCount = await _db.MachineryExpenseTypes.CountAsync(t => t.IsActive, cancellationToken);

        var query = _db.MachineryExpenses.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(e =>
                e.MachineName.Contains(term) ||
                e.ExpenseType.Contains(term) ||
                (e.Operator != null && e.Operator.Contains(term)) ||
                (e.Remarks != null && e.Remarks.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(expenseType))
        {
            var typeFilter = expenseType.Trim();
            query = query.Where(e => e.ExpenseType == typeFilter);
        }

        if (machineryId.HasValue)
        {
            query = query.Where(e => e.MachineryId == machineryId.Value);
        }

        if (fromDate.HasValue)
        {
            var start = fromDate.Value.Date;
            query = query.Where(e => e.Date >= start);
        }

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(e => e.Date <= end);
        }

        var items = await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Id)
            .Select(e => new MachineryExpenseDto
            {
                Id = e.Id,
                MachineryId = e.MachineryId,
                MachineName = e.MachineName,
                ExpenseType = e.ExpenseType,
                Date = e.Date,
                Amount = e.Amount,
                Operator = e.Operator,
                Remarks = e.Remarks,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new MachineryExpenseListResponse
        {
            TotalExpenseRecords = totalRecords,
            RowsShown = items.Count,
            ExpenseTypesCount = expenseTypesCount,
            TotalAmount = items.Sum(x => x.Amount),
            Items = items
        });
    }

    [HttpGet("types")]
    public async Task<ActionResult<List<MachineryExpenseTypeDto>>> GetExpenseTypes(CancellationToken cancellationToken)
    {
        var types = await _db.MachineryExpenseTypes
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.Id)
            .Select(t => new MachineryExpenseTypeDto
            {
                Id = t.Id,
                Code = t.Code,
                Name = t.Name,
                Description = t.Description,
                IsActive = t.IsActive
            })
            .ToListAsync(cancellationToken);

        return Ok(types);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MachineryExpenseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var expense = await _db.MachineryExpenses
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new MachineryExpenseDto
            {
                Id = e.Id,
                MachineryId = e.MachineryId,
                MachineName = e.MachineName,
                ExpenseType = e.ExpenseType,
                Date = e.Date,
                Amount = e.Amount,
                Operator = e.Operator,
                Remarks = e.Remarks,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (expense is null)
        {
            return NotFound(new { message = $"Machinery expense record with ID {id} was not found." });
        }

        return Ok(expense);
    }

    [HttpPost]
    public async Task<ActionResult<MachineryExpenseDto>> Create(
        [FromBody] CreateMachineryExpenseRequest request,
        CancellationToken cancellationToken)
    {
        var (resolvedMachineId, resolvedMachineName, errorMessage) =
            await ResolveMachineAsync(request.MachineryId, request.MachineName, cancellationToken);

        if (errorMessage is not null)
        {
            return BadRequest(new { message = errorMessage });
        }

        var entity = new MachineryExpense
        {
            MachineryId = resolvedMachineId,
            MachineName = resolvedMachineName!,
            ExpenseType = request.ExpenseType.Trim(),
            Date = request.Date!.Value,
            Amount = request.Amount!.Value,
            Operator = string.IsNullOrWhiteSpace(request.Operator) ? null : request.Operator.Trim(),
            Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.MachineryExpenses.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToDto(entity));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MachineryExpenseDto>> Update(
        int id,
        [FromBody] UpdateMachineryExpenseRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.MachineryExpenses.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = $"Machinery expense record with ID {id} was not found." });
        }

        var (resolvedMachineId, resolvedMachineName, errorMessage) =
            await ResolveMachineAsync(request.MachineryId, request.MachineName, cancellationToken);

        if (errorMessage is not null)
        {
            return BadRequest(new { message = errorMessage });
        }

        entity.MachineryId = resolvedMachineId;
        entity.MachineName = resolvedMachineName!;
        entity.ExpenseType = request.ExpenseType.Trim();
        entity.Date = request.Date!.Value;
        entity.Amount = request.Amount!.Value;
        entity.Operator = string.IsNullOrWhiteSpace(request.Operator) ? null : request.Operator.Trim();
        entity.Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(entity));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var entity = await _db.MachineryExpenses.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = $"Machinery expense record with ID {id} was not found." });
        }

        _db.MachineryExpenses.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<(int? MachineId, string? MachineName, string? ErrorMessage)> ResolveMachineAsync(
        int? requestedMachineryId,
        string? requestedMachineName,
        CancellationToken cancellationToken)
    {
        var trimmedName = string.IsNullOrWhiteSpace(requestedMachineName) ? null : requestedMachineName.Trim();

        if (requestedMachineryId.HasValue)
        {
            var machine = await _db.Machineries
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == requestedMachineryId.Value, cancellationToken);

            if (machine is null)
            {
                return (null, null, $"Machinery record with ID {requestedMachineryId.Value} was not found.");
            }

            return (machine.Id, trimmedName ?? machine.MachineName, null);
        }

        if (trimmedName is null)
        {
            return (null, null, "MachineName or MachineryId is required.");
        }

        var matchedMachine = await _db.Machineries
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MachineName.ToLower() == trimmedName.ToLower(), cancellationToken);

        return (matchedMachine?.Id, trimmedName, null);
    }

    private static MachineryExpenseDto ToDto(MachineryExpense entity) => new()
    {
        Id = entity.Id,
        MachineryId = entity.MachineryId,
        MachineName = entity.MachineName,
        ExpenseType = entity.ExpenseType,
        Date = entity.Date,
        Amount = entity.Amount,
        Operator = entity.Operator,
        Remarks = entity.Remarks,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };
}
