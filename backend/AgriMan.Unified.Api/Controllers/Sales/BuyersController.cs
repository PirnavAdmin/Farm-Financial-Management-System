using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;
using SalesApi.Models;

namespace SalesApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BuyersController : ControllerBase
{
    private readonly SalesDbContext _context;
    private readonly ILogger<BuyersController> _logger;

    public BuyersController(SalesDbContext context, ILogger<BuyersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Buyer>>> GetAll([FromQuery] string? search, [FromQuery] string? status)
    {
        var query = _context.Buyers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(b =>
                b.BuyerCode.ToLower().Contains(term) ||
                b.BuyerName.ToLower().Contains(term) ||
                b.Mobile.ToLower().Contains(term) ||
                (b.BusinessName != null && b.BusinessName.ToLower().Contains(term)) ||
                (b.Gstin != null && b.Gstin.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(b => b.Status.ToLower() == status.Trim().ToLower());
        }

        var buyers = await query.OrderBy(b => b.BuyerName).ToListAsync();
        return Ok(buyers);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Buyer>> GetById(int id)
    {
        var buyer = await _context.Buyers.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (buyer == null) return NotFound(new { message = $"Buyer with ID {id} not found." });
        return Ok(buyer);
    }

    [HttpPost]
    public async Task<ActionResult<Buyer>> Create([FromBody] Buyer buyer)
    {
        if (string.IsNullOrWhiteSpace(buyer.BuyerCode))
        {
            var nextId = (await _context.Buyers.MaxAsync(b => (int?)b.Id) ?? 0) + 1;
            buyer.BuyerCode = $"BUY-{nextId:D3}";
        }
        else
        {
            var exists = await _context.Buyers.AnyAsync(b => b.BuyerCode.ToLower() == buyer.BuyerCode.Trim().ToLower());
            if (exists) return BadRequest(new { message = $"Buyer code '{buyer.BuyerCode}' already exists." });
        }

        buyer.CreatedAt = DateTime.UtcNow;
        _context.Buyers.Add(buyer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = buyer.Id }, buyer);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Buyer>> Update(int id, [FromBody] Buyer updated)
    {
        var buyer = await _context.Buyers.FindAsync(id);
        if (buyer == null) return NotFound(new { message = $"Buyer with ID {id} not found." });

        buyer.BuyerName = updated.BuyerName.Trim();
        buyer.Mobile = updated.Mobile.Trim();
        buyer.Address = updated.Address;
        buyer.BusinessName = updated.BusinessName;
        buyer.Gstin = updated.Gstin;
        buyer.OpeningBalance = updated.OpeningBalance;
        buyer.Status = string.IsNullOrWhiteSpace(updated.Status) ? buyer.Status : updated.Status;
        buyer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(buyer);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var buyer = await _context.Buyers.FindAsync(id);
        if (buyer == null) return NotFound(new { message = $"Buyer with ID {id} not found." });

        _context.Buyers.Remove(buyer);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
