using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;
using SalesApi.DTOs;
using SalesApi.Models;

namespace SalesApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesController : ControllerBase
{
    private readonly SalesDbContext _context;
    private readonly ILogger<SalesController> _logger;

    public SalesController(SalesDbContext context, ILogger<SalesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of sales records with filtering, searching, and sorting.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SaleResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<SaleResponseDto>>> GetAll([FromQuery] SaleQueryParameters query)
    {
        var salesQuery = _context.Sales.AsNoTracking().AsQueryable();

        // 1. Search filter across SalesNo, Buyer, Farm, Crop
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            salesQuery = salesQuery.Where(s =>
                s.SalesNo.ToLower().Contains(term) ||
                s.Buyer.ToLower().Contains(term) ||
                s.Farm.ToLower().Contains(term) ||
                s.Crop.ToLower().Contains(term));
        }

        // 2. Status filter
        if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            salesQuery = salesQuery.Where(s => s.PaymentStatus.ToLower() == query.Status.Trim().ToLower());
        }

        // 3. Crop filter
        if (!string.IsNullOrWhiteSpace(query.Crop))
        {
            salesQuery = salesQuery.Where(s => s.Crop.ToLower() == query.Crop.Trim().ToLower());
        }

        // 4. Farm filter
        if (!string.IsNullOrWhiteSpace(query.Farm))
        {
            salesQuery = salesQuery.Where(s => s.Farm.ToLower() == query.Farm.Trim().ToLower());
        }

        // 5. Date filters
        if (query.FromDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate >= query.FromDate.Value);
        }
        if (query.ToDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SalesDate <= query.ToDate.Value);
        }

        var totalCount = await salesQuery.CountAsync();

        // 6. Sorting
        salesQuery = query.SortBy?.ToLower() switch
        {
            "dateasc" => salesQuery.OrderBy(s => s.SalesDate),
            "amountdesc" => salesQuery.OrderByDescending(s => s.NetAmount),
            "amountasc" => salesQuery.OrderBy(s => s.NetAmount),
            _ => salesQuery.OrderByDescending(s => s.SalesDate).ThenByDescending(s => s.Id)
        };

        // 7. Pagination
        var page = query.Page > 0 ? query.Page : 1;
        var pageSize = query.PageSize > 0 ? query.PageSize : 10;
        var items = await salesQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(new PagedResult<SaleResponseDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get single sales record by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> GetById(int id)
    {
        var sale = await _context.Sales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null)
        {
            return NotFound(new { message = $"Sales record with ID {id} not found." });
        }

        return Ok(MapToDto(sale));
    }

    /// <summary>
    /// Get single sales record by Sales Number (e.g. SAL-2026-001).
    /// </summary>
    [HttpGet("by-number/{salesNo}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> GetBySalesNo(string salesNo)
    {
        var sale = await _context.Sales.AsNoTracking()
            .FirstOrDefaultAsync(s => s.SalesNo.ToLower() == salesNo.Trim().ToLower());

        if (sale == null)
        {
            return NotFound(new { message = $"Sales record with SalesNo '{salesNo}' not found." });
        }

        return Ok(MapToDto(sale));
    }

    /// <summary>
    /// Get sales analytics summary (total amount, commission, transport, net, status breakdown).
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(SaleSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SaleSummaryDto>> GetSummary()
    {
        var sales = await _context.Sales.AsNoTracking().ToListAsync();

        var summary = new SaleSummaryDto
        {
            TotalSalesCount = sales.Count,
            TotalGrossAmount = sales.Sum(s => s.GrossAmount),
            TotalCommission = sales.Sum(s => s.Commission),
            TotalTransport = sales.Sum(s => s.Transport),
            TotalNetAmount = sales.Sum(s => s.NetAmount),
            PendingCount = sales.Count(s => string.Equals(s.PaymentStatus, "Pending", StringComparison.OrdinalIgnoreCase)),
            PartPaidCount = sales.Count(s => string.Equals(s.PaymentStatus, "Part Paid", StringComparison.OrdinalIgnoreCase)),
            PaidCount = sales.Count(s => string.Equals(s.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase)),
            PendingAmount = sales.Where(s => !string.Equals(s.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase)).Sum(s => s.NetAmount),
            PaidAmount = sales.Where(s => string.Equals(s.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase)).Sum(s => s.NetAmount)
        };

        return Ok(summary);
    }

    /// <summary>
    /// Create a new sales record with automatic calculation of Gross and Net amounts.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SaleResponseDto>> Create([FromBody] CreateSaleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Auto-generate SalesNo if not provided
        var salesNo = dto.SalesNo?.Trim();
        if (string.IsNullOrWhiteSpace(salesNo))
        {
            var nextId = (await _context.Sales.MaxAsync(s => (int?)s.Id) ?? 0) + 1;
            salesNo = $"SAL-{DateTime.UtcNow.Year}-{nextId:D3}";
        }
        else
        {
            // Verify uniqueness
            var exists = await _context.Sales.AnyAsync(s => s.SalesNo.ToLower() == salesNo.ToLower());
            if (exists)
            {
                return BadRequest(new { message = $"Sales record with SalesNo '{salesNo}' already exists." });
            }
        }

        // Auto calculate Gross Amount = Quantity * Rate
        var grossAmount = dto.GrossAmount.HasValue && dto.GrossAmount.Value > 0
            ? dto.GrossAmount.Value
            : Math.Round(dto.Quantity * dto.Rate, 2);

        // Auto calculate Net Amount = GrossAmount - Commission - Transport
        var netAmount = dto.NetAmount.HasValue && dto.NetAmount.Value > 0
            ? dto.NetAmount.Value
            : Math.Round(grossAmount - dto.Commission - dto.Transport, 2);

        var sale = new Sale
        {
            SalesNo = salesNo,
            SalesDate = dto.SalesDate ?? DateTime.UtcNow,
            Buyer = dto.Buyer.Trim(),
            Farm = dto.Farm.Trim(),
            Crop = dto.Crop.Trim(),
            Quantity = dto.Quantity,
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim(),
            Rate = dto.Rate,
            GrossAmount = grossAmount,
            Commission = dto.Commission,
            Transport = dto.Transport,
            NetAmount = netAmount,
            PaymentStatus = string.IsNullOrWhiteSpace(dto.PaymentStatus) ? "Pending" : dto.PaymentStatus.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created Sales record ID {Id} ({SalesNo})", sale.Id, sale.SalesNo);

        return CreatedAtAction(nameof(GetById), new { id = sale.Id }, MapToDto(sale));
    }

    /// <summary>
    /// Update an existing sales record.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SaleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponseDto>> Update(int id, [FromBody] UpdateSaleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var sale = await _context.Sales.FindAsync(id);
        if (sale == null)
        {
            return NotFound(new { message = $"Sales record with ID {id} not found." });
        }

        // Check SalesNo conflict if changed
        if (!string.IsNullOrWhiteSpace(dto.SalesNo) && !dto.SalesNo.Equals(sale.SalesNo, StringComparison.OrdinalIgnoreCase))
        {
            var conflict = await _context.Sales.AnyAsync(s => s.Id != id && s.SalesNo.ToLower() == dto.SalesNo.Trim().ToLower());
            if (conflict)
            {
                return BadRequest(new { message = $"SalesNo '{dto.SalesNo}' is already taken by another record." });
            }
            sale.SalesNo = dto.SalesNo.Trim();
        }

        var grossAmount = dto.GrossAmount.HasValue && dto.GrossAmount.Value > 0
            ? dto.GrossAmount.Value
            : Math.Round(dto.Quantity * dto.Rate, 2);

        var netAmount = dto.NetAmount.HasValue && dto.NetAmount.Value > 0
            ? dto.NetAmount.Value
            : Math.Round(grossAmount - dto.Commission - dto.Transport, 2);

        sale.SalesDate = dto.SalesDate ?? sale.SalesDate;
        sale.Buyer = dto.Buyer.Trim();
        sale.Farm = dto.Farm.Trim();
        sale.Crop = dto.Crop.Trim();
        sale.Quantity = dto.Quantity;
        sale.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "kg" : dto.Unit.Trim();
        sale.Rate = dto.Rate;
        sale.GrossAmount = grossAmount;
        sale.Commission = dto.Commission;
        sale.Transport = dto.Transport;
        sale.NetAmount = netAmount;
        sale.PaymentStatus = string.IsNullOrWhiteSpace(dto.PaymentStatus) ? sale.PaymentStatus : dto.PaymentStatus.Trim();
        sale.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated Sales record ID {Id} ({SalesNo})", sale.Id, sale.SalesNo);

        return Ok(MapToDto(sale));
    }

    /// <summary>
    /// Delete a sales record by ID.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var sale = await _context.Sales.FindAsync(id);
        if (sale == null)
        {
            return NotFound(new { message = $"Sales record with ID {id} not found." });
        }

        _context.Sales.Remove(sale);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted Sales record ID {Id} ({SalesNo})", id, sale.SalesNo);

        return NoContent();
    }

    /// <summary>
    /// Seed default sales records if database is empty.
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Seed()
    {
        if (await _context.Sales.AnyAsync())
        {
            return Ok(new { message = "Database already contains sales records. No seed performed." });
        }

        var seedRecords = new List<Sale>
        {
            new()
            {
                SalesNo = "SAL-2026-001",
                SalesDate = new DateTime(2026, 11, 1),
                Buyer = "Green Agro Foods Ltd",
                Farm = "Sunrise Valley Farm",
                Crop = "Organic Tomatoes",
                Quantity = 1500m,
                Unit = "kg",
                Rate = 35m,
                GrossAmount = 52500m,
                Commission = 1500m,
                Transport = 2000m,
                NetAmount = 49000m,
                PaymentStatus = "Paid",
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                SalesNo = "SAL-2026-002",
                SalesDate = new DateTime(2026, 11, 3),
                Buyer = "Fresh Mart Wholesale",
                Farm = "Green Hills Orchard",
                Crop = "Potatoes",
                Quantity = 800m,
                Unit = "kg",
                Rate = 20m,
                GrossAmount = 16000m,
                Commission = 500m,
                Transport = 500m,
                NetAmount = 15000m,
                PaymentStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Sales.AddRange(seedRecords);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Successfully seeded initial sales records.", count = seedRecords.Count });
    }

    private static SaleResponseDto MapToDto(Sale s) => new()
    {
        Id = s.Id,
        SalesNo = s.SalesNo,
        SalesDate = s.SalesDate,
        Buyer = s.Buyer,
        Farm = s.Farm,
        Crop = s.Crop,
        Quantity = s.Quantity,
        Unit = s.Unit,
        Rate = s.Rate,
        GrossAmount = s.GrossAmount,
        Commission = s.Commission,
        Transport = s.Transport,
        NetAmount = s.NetAmount,
        PaymentStatus = s.PaymentStatus,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };
}
