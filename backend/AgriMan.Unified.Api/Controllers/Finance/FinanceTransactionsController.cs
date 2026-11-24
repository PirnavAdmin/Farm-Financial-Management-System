using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("11. Finance, Bank Accounts & Reports (Module 11)")]
    public class FinancePaymentsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public FinancePaymentsController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FinancePayment>>> GetPayments(
            [FromQuery] string? search,
            [FromQuery] string? paymentType,
            [FromQuery] string? paymentMode,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.FinancePayments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(paymentType) && !paymentType.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.PaymentType == paymentType);

            if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(p => p.PaymentMode == paymentMode);

            if (fromDate.HasValue)
                query = query.Where(p => p.Date >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(p => p.Date <= toDate.Value);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.PaymentNo.Contains(search) || p.Party.Contains(search) || (p.ReferenceTransaction != null && p.ReferenceTransaction.Contains(search)));

            return await query.OrderByDescending(p => p.Date).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FinancePayment>> GetPayment(int id)
        {
            var payment = await _context.FinancePayments.FindAsync(id);
            if (payment == null) return NotFound();
            return payment;
        }

        [HttpPost]
        public async Task<ActionResult<FinancePayment>> CreatePayment([FromBody] FinancePayment payment)
        {
            if (string.IsNullOrWhiteSpace(payment.PaymentNo))
            {
                var year = DateTime.UtcNow.Year;
                var count = await _context.FinancePayments.CountAsync() + 1;
                payment.PaymentNo = $"PAY-{year}-{count:D4}";
            }
            payment.CreatedAt = DateTime.UtcNow;
            _context.FinancePayments.Add(payment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, [FromBody] FinancePayment payment)
        {
            if (id != payment.Id) return BadRequest();
            _context.Entry(payment).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(payment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.FinancePayments.FindAsync(id);
            if (payment == null) return NotFound();
            _context.FinancePayments.Remove(payment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Tags("11. Finance, Bank Accounts & Reports (Module 11)")]
    public class FinanceReceiptsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public FinanceReceiptsController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FinanceReceipt>>> GetReceipts(
            [FromQuery] string? search,
            [FromQuery] string? paymentMode,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.FinanceReceipts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(r => r.PaymentMode == paymentMode);

            if (fromDate.HasValue)
                query = query.Where(r => r.Date >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(r => r.Date <= toDate.Value);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(r => r.ReceiptNo.Contains(search) || r.From.Contains(search) || (r.Reference != null && r.Reference.Contains(search)));

            return await query.OrderByDescending(r => r.Date).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FinanceReceipt>> GetReceipt(int id)
        {
            var receipt = await _context.FinanceReceipts.FindAsync(id);
            if (receipt == null) return NotFound();
            return receipt;
        }

        [HttpPost]
        public async Task<ActionResult<FinanceReceipt>> CreateReceipt([FromBody] FinanceReceipt receipt)
        {
            if (string.IsNullOrWhiteSpace(receipt.ReceiptNo))
            {
                var year = DateTime.UtcNow.Year;
                var count = await _context.FinanceReceipts.CountAsync() + 1;
                receipt.ReceiptNo = $"REC-{year}-{count:D4}";
            }
            receipt.CreatedAt = DateTime.UtcNow;
            _context.FinanceReceipts.Add(receipt);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, receipt);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReceipt(int id, [FromBody] FinanceReceipt receipt)
        {
            if (id != receipt.Id) return BadRequest();
            _context.Entry(receipt).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(receipt);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            var receipt = await _context.FinanceReceipts.FindAsync(id);
            if (receipt == null) return NotFound();
            _context.FinanceReceipts.Remove(receipt);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
