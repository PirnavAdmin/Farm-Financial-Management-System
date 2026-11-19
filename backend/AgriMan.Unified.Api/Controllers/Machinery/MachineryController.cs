using Agriman.Machinery.Api.Data;
using Agriman.Machinery.Api.DTOs;
using Agriman.Machinery.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agriman.Machinery.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MachineryController : ControllerBase
{
    private readonly MachineryDbContext _db;

    private static readonly List<string> DefaultMachineTypes =
    [
        "Tractor",
        "Harvester",
        "Rotavator",
        "Cultivator",
        "Plough",
        "Seeder",
        "Sprayer",
        "Thresher",
        "Water Pump",
        "Trailer",
        "Other"
    ];

    private static readonly List<string> DefaultFuelTypes =
    [
        "Diesel",
        "Petrol",
        "Electric",
        "CNG",
        "Hybrid",
        "None"
    ];

    private static readonly List<string> DefaultStatuses =
    [
        "Active",
        "Under Maintenance",
        "Idle",
        "Out of Service",
        "Sold"
    ];

    public MachineryController(MachineryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<MachineryListResponse>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? machineType,
        [FromQuery] string? fuelType,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var totalMachines = await _db.Machineries.CountAsync(cancellationToken);
        var expenseTypesCount = await _db.MachineryExpenseTypes.CountAsync(t => t.IsActive, cancellationToken);

        var query = _db.Machineries.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m =>
                m.MachineName.Contains(term) ||
                m.MachineType.Contains(term) ||
                (m.RegistrationNo != null && m.RegistrationNo.Contains(term)) ||
                (m.FuelType != null && m.FuelType.Contains(term)) ||
                m.Status.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(machineType))
        {
            var typeFilter = machineType.Trim();
            query = query.Where(m => m.MachineType == typeFilter);
        }

        if (!string.IsNullOrWhiteSpace(fuelType))
        {
            var fuelFilter = fuelType.Trim();
            query = query.Where(m => m.FuelType == fuelFilter);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusFilter = status.Trim();
            query = query.Where(m => m.Status == statusFilter);
        }

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .Select(m => new MachineryDto
            {
                Id = m.Id,
                MachineName = m.MachineName,
                MachineType = m.MachineType,
                RegistrationNo = m.RegistrationNo,
                PurchaseDate = m.PurchaseDate,
                PurchaseCost = m.PurchaseCost,
                CurrentValue = m.CurrentValue,
                FuelType = m.FuelType,
                Status = m.Status,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                ExpenseCount = m.Expenses.Count,
                TotalExpenses = m.Expenses.Sum(e => (decimal?)e.Amount) ?? 0m
            })
            .ToListAsync(cancellationToken);

        return Ok(new MachineryListResponse
        {
            TotalMachines = totalMachines,
            RowsShown = items.Count,
            ExpenseTypesCount = expenseTypesCount,
            Items = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MachineryDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var machine = await _db.Machineries
            .AsNoTracking()
            .Where(m => m.Id == id)
            .Select(m => new MachineryDto
            {
                Id = m.Id,
                MachineName = m.MachineName,
                MachineType = m.MachineType,
                RegistrationNo = m.RegistrationNo,
                PurchaseDate = m.PurchaseDate,
                PurchaseCost = m.PurchaseCost,
                CurrentValue = m.CurrentValue,
                FuelType = m.FuelType,
                Status = m.Status,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                ExpenseCount = m.Expenses.Count,
                TotalExpenses = m.Expenses.Sum(e => (decimal?)e.Amount) ?? 0m
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (machine is null)
        {
            return NotFound(new { message = $"Machinery record with ID {id} was not found." });
        }

        return Ok(machine);
    }

    [HttpPost]
    public async Task<ActionResult<MachineryDto>> Create(
        [FromBody] CreateMachineryRequest request,
        CancellationToken cancellationToken)
    {
        var registrationNo = string.IsNullOrWhiteSpace(request.RegistrationNo)
            ? null
            : request.RegistrationNo.Trim();

        if (registrationNo is not null)
        {
            var exists = await _db.Machineries
                .AnyAsync(m => m.RegistrationNo == registrationNo, cancellationToken);
            if (exists)
            {
                return Conflict(new { message = $"A machine with registration number '{registrationNo}' already exists." });
            }
        }

        var entity = new Models.Machinery
        {
            MachineName = request.MachineName.Trim(),
            MachineType = request.MachineType.Trim(),
            RegistrationNo = registrationNo,
            PurchaseDate = request.PurchaseDate,
            PurchaseCost = request.PurchaseCost ?? 0m,
            CurrentValue = request.CurrentValue ?? 0m,
            FuelType = string.IsNullOrWhiteSpace(request.FuelType) ? null : request.FuelType.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Machineries.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = ToDto(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MachineryDto>> Update(
        int id,
        [FromBody] UpdateMachineryRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.Machineries.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = $"Machinery record with ID {id} was not found." });
        }

        var registrationNo = string.IsNullOrWhiteSpace(request.RegistrationNo)
            ? null
            : request.RegistrationNo.Trim();

        if (registrationNo is not null)
        {
            var duplicate = await _db.Machineries
                .AnyAsync(m => m.Id != id && m.RegistrationNo == registrationNo, cancellationToken);
            if (duplicate)
            {
                return Conflict(new { message = $"Another machine with registration number '{registrationNo}' already exists." });
            }
        }

        var previousName = entity.MachineName;
        var newName = request.MachineName.Trim();

        entity.MachineName = newName;
        entity.MachineType = request.MachineType.Trim();
        entity.RegistrationNo = registrationNo;
        entity.PurchaseDate = request.PurchaseDate;
        entity.PurchaseCost = request.PurchaseCost ?? 0m;
        entity.CurrentValue = request.CurrentValue ?? 0m;
        entity.FuelType = string.IsNullOrWhiteSpace(request.FuelType) ? null : request.FuelType.Trim();
        entity.Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        if (!string.Equals(previousName, newName, StringComparison.Ordinal))
        {
            var linkedExpenses = await _db.MachineryExpenses
                .Where(e => e.MachineryId == id)
                .ToListAsync(cancellationToken);
            foreach (var expense in linkedExpenses)
            {
                expense.MachineName = newName;
                expense.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        var expenseStats = await _db.MachineryExpenses
            .Where(e => e.MachineryId == id)
            .GroupBy(e => e.MachineryId)
            .Select(g => new { Count = g.Count(), Total = g.Sum(x => x.Amount) })
            .FirstOrDefaultAsync(cancellationToken);

        var dto = ToDto(entity, expenseStats?.Count ?? 0, expenseStats?.Total ?? 0m);
        return Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var entity = await _db.Machineries.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (entity is null)
        {
            return NotFound(new { message = $"Machinery record with ID {id} was not found." });
        }

        _db.Machineries.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("summary")]
    public async Task<ActionResult<MachinerySummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var machines = await _db.Machineries.AsNoTracking().ToListAsync(cancellationToken);
        var expenseCount = await _db.MachineryExpenses.CountAsync(cancellationToken);
        var totalExpenseAmount = await _db.MachineryExpenses.SumAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0m;
        var expenseTypesCount = await _db.MachineryExpenseTypes.CountAsync(t => t.IsActive, cancellationToken);

        return Ok(new MachinerySummaryDto
        {
            TotalMachines = machines.Count,
            ActiveMachines = machines.Count(m => string.Equals(m.Status, "Active", StringComparison.OrdinalIgnoreCase)),
            UnderMaintenanceMachines = machines.Count(m => string.Equals(m.Status, "Under Maintenance", StringComparison.OrdinalIgnoreCase)),
            InactiveMachines = machines.Count(m =>
                !string.Equals(m.Status, "Active", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(m.Status, "Under Maintenance", StringComparison.OrdinalIgnoreCase)),
            TotalPurchaseCost = machines.Sum(m => m.PurchaseCost),
            TotalCurrentValue = machines.Sum(m => m.CurrentValue),
            TotalExpenseRecords = expenseCount,
            TotalExpenseAmount = totalExpenseAmount,
            ExpenseTypesCount = expenseTypesCount
        });
    }

    [HttpGet("lookups")]
    public async Task<ActionResult<MachineryLookupsDto>> GetLookups(CancellationToken cancellationToken)
    {
        var expenseTypes = await _db.MachineryExpenseTypes
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

        return Ok(new MachineryLookupsDto
        {
            MachineTypes = DefaultMachineTypes,
            FuelTypes = DefaultFuelTypes,
            Statuses = DefaultStatuses,
            ExpenseTypes = expenseTypes
        });
    }

    [HttpGet("{machineryId:int}/expenses")]
    public async Task<ActionResult<MachineryExpenseListResponse>> GetExpensesForMachine(
        int machineryId,
        CancellationToken cancellationToken)
    {
        var machineExists = await _db.Machineries.AnyAsync(m => m.Id == machineryId, cancellationToken);
        if (!machineExists)
        {
            return NotFound(new { message = $"Machinery record with ID {machineryId} was not found." });
        }

        var expenseTypesCount = await _db.MachineryExpenseTypes.CountAsync(t => t.IsActive, cancellationToken);
        var items = await _db.MachineryExpenses
            .AsNoTracking()
            .Where(e => e.MachineryId == machineryId)
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
            TotalExpenseRecords = items.Count,
            RowsShown = items.Count,
            ExpenseTypesCount = expenseTypesCount,
            TotalAmount = items.Sum(x => x.Amount),
            Items = items
        });
    }

    [HttpPost("{machineryId:int}/expenses")]
    public async Task<ActionResult<MachineryExpenseDto>> AddExpenseForMachine(
        int machineryId,
        [FromBody] CreateMachineryExpenseRequest request,
        CancellationToken cancellationToken)
    {
        var machine = await _db.Machineries
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == machineryId, cancellationToken);

        if (machine is null)
        {
            return NotFound(new { message = $"Machinery record with ID {machineryId} was not found." });
        }

        var entity = new MachineryExpense
        {
            MachineryId = machine.Id,
            MachineName = string.IsNullOrWhiteSpace(request.MachineName) ? machine.MachineName : request.MachineName.Trim(),
            ExpenseType = request.ExpenseType.Trim(),
            Date = request.Date!.Value,
            Amount = request.Amount!.Value,
            Operator = string.IsNullOrWhiteSpace(request.Operator) ? null : request.Operator.Trim(),
            Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.MachineryExpenses.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = new MachineryExpenseDto
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

        return CreatedAtAction(nameof(MachineryExpensesController.GetById), "MachineryExpenses", new { id = entity.Id }, dto);
    }

    /// <summary>
    /// Out-of-the-box Analytics: Return Machinery Fleet ROI, Maintenance cost ratio, and operating health
    /// </summary>
    [HttpGet("roi")]
    public async Task<IActionResult> GetFleetRoi(CancellationToken cancellationToken)
    {
        var machines = await _db.Machineries
            .AsNoTracking()
            .Select(m => new
            {
                m.Id,
                MachineCode = $"MCH-{m.Id:D3}",
                m.MachineName,
                m.MachineType,
                m.PurchaseCost,
                m.CurrentValue,
                m.Status,
                TotalMaintenanceCost = m.Expenses.Sum(e => (decimal?)e.Amount) ?? 0m,
                ExpenseCount = m.Expenses.Count
            })
            .ToListAsync(cancellationToken);

        var report = machines.Select(m => new
        {
            m.Id,
            m.MachineCode,
            m.MachineName,
            m.MachineType,
            m.PurchaseCost,
            m.CurrentValue,
            m.Status,
            m.TotalMaintenanceCost,
            m.ExpenseCount,
            MaintenanceToCostRatio = m.PurchaseCost > 0 ? Math.Round((m.TotalMaintenanceCost / m.PurchaseCost) * 100, 2) : 0,
            EstimatedNetValue = Math.Max(0, m.CurrentValue - m.TotalMaintenanceCost)
        });

        return Ok(new
        {
            success = true,
            message = "Machinery Fleet ROI & Maintenance analysis retrieved successfully.",
            data = report
        });
    }

    private static MachineryDto ToDto(Models.Machinery entity, int expenseCount = 0, decimal totalExpenses = 0m) => new()
    {
        Id = entity.Id,
        MachineName = entity.MachineName,
        MachineType = entity.MachineType,
        RegistrationNo = entity.RegistrationNo,
        PurchaseDate = entity.PurchaseDate,
        PurchaseCost = entity.PurchaseCost,
        CurrentValue = entity.CurrentValue,
        FuelType = entity.FuelType,
        Status = entity.Status,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        ExpenseCount = expenseCount,
        TotalExpenses = totalExpenses
    };
}
