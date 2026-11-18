using AgriMan.Api.Data;
using AgriMan.Expenses.Api.Data;
using Agriman.Machinery.Api.Data;
using FarmManagementApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;

namespace AgriMan.Unified.Api.Controllers.System;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _authDb;
    private readonly FarmDbContext _farmDb;
    private readonly ExpenseDbContext _expenseDb;
    private readonly SalesDbContext _salesDb;
    private readonly MachineryDbContext _machineryDb;

    public HealthController(
        ApplicationDbContext authDb,
        FarmDbContext farmDb,
        ExpenseDbContext expenseDb,
        SalesDbContext salesDb,
        MachineryDbContext machineryDb)
    {
        _authDb = authDb;
        _farmDb = farmDb;
        _expenseDb = expenseDb;
        _salesDb = salesDb;
        _machineryDb = machineryDb;
    }

    /// <summary>
    /// Check Farmersdb SQL Server connectivity and applied EF Core migrations across all 9 unified modules.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Check(CancellationToken cancellationToken)
    {
        var canConnect = await _machineryDb.Database.CanConnectAsync(cancellationToken);
        if (!canConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "Unhealthy",
                database = "Farmersdb",
                server = "NIRANJAN\\SQLEXPRESS"
            });
        }

        var authMigrations = await _authDb.Database.GetAppliedMigrationsAsync(cancellationToken);
        var farmMigrations = await _farmDb.Database.GetAppliedMigrationsAsync(cancellationToken);
        var expenseMigrations = await _expenseDb.Database.GetAppliedMigrationsAsync(cancellationToken);
        var salesMigrations = await _salesDb.Database.GetAppliedMigrationsAsync(cancellationToken);
        var machineryMigrations = await _machineryDb.Database.GetAppliedMigrationsAsync(cancellationToken);

        return Ok(new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            database = "Farmersdb",
            server = "NIRANJAN\\SQLEXPRESS",
            appliedMigrations = new
            {
                auth = authMigrations,
                farms = farmMigrations,
                expenses = expenseMigrations,
                sales = salesMigrations,
                machinery = machineryMigrations
            }
        });
    }
}
