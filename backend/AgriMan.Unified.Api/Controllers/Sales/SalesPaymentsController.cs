using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesApi.Data;
using SalesApi.Models;

namespace SalesApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SalesPaymentsController : ControllerBase
{
    private readonly SalesDbContext _context;
    private readonly ILogger<SalesPaymentsController> _logger;

    public SalesPaymentsController(SalesDbContext context, ILogger<SalesPaymentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesPayment>>> GetAll([FromQuery] string? search, [FromQuery] string? buyer, [FromQuery] string? salesNo)
    {
        var query = _context.SalesPayments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.PaymentNo.ToLower().Contains(term) ||
                p.Buyer.ToLower().Contains(term) ||
                p.SalesNo.ToLower().Contains(term) ||
                (p.ReferenceNo != null && p.ReferenceNo.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(buyer))
        {
            query = query.Where(p => p.Buyer.ToLower() == buyer.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(salesNo))
        {
            query = query.Where(p => p.SalesNo.ToLower() == salesNo.Trim().ToLower());
        }

        var payments = await query.OrderByDescending(p => p.PaymentDate).ThenByDescending(p => p.Id).ToListAsync();
        return Ok(payments);
    }

    [HttpPost]
    public async Task<ActionResult<SalesPayment>> Create([FromBody] SalesPayment payment)
    {
        if (string.IsNullOrWhiteSpace(payment.PaymentNo))
        {
            var nextId = (await _context.SalesPayments.MaxAsync(p => (int?)p.Id) ?? 0) + 1;
            payment.PaymentNo = $"SPAY-{DateTime.UtcNow.Year}-{nextId:D3}";
        }

        payment.CreatedAt = DateTime.UtcNow;
        _context.SalesPayments.Add(payment);

        // Update the related sale status if sales record exists
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.SalesNo.ToLower() == payment.SalesNo.Trim().ToLower());
        if (sale != null)
        {
            var previousPaid = await _context.SalesPayments
                .Where(p => p.SalesNo.ToLower() == sale.SalesNo.ToLower())
                .SumAsync(p => p.PaymentAmount);

            var totalPaid = previousPaid + payment.PaymentAmount;
            if (totalPaid >= sale.NetAmount)
            {
                sale.PaymentStatus = "Paid";
            }
            else if (totalPaid > 0)
            {
                sale.PaymentStatus = "Partially Paid";
            }
            sale.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(payment);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await _context.SalesPayments.FindAsync(id);
        if (payment == null) return NotFound(new { message = $"Payment record with ID {id} not found." });

        var salesNo = payment.SalesNo;
        _context.SalesPayments.Remove(payment);
        await _context.SaveChangesAsync();

        // Recalculate sale status
        var sale = await _context.Sales.FirstOrDefaultAsync(s => s.SalesNo.ToLower() == salesNo.ToLower());
        if (sale != null)
        {
            var remainingPaid = await _context.SalesPayments
                .Where(p => p.SalesNo.ToLower() == sale.SalesNo.ToLower())
                .SumAsync(p => p.PaymentAmount);

            if (remainingPaid >= sale.NetAmount)
            {
                sale.PaymentStatus = "Paid";
            }
            else if (remainingPaid > 0)
            {
                sale.PaymentStatus = "Partially Paid";
            }
            else
            {
                sale.PaymentStatus = "Pending";
            }
            sale.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }
}
