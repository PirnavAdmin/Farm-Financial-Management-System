using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupplierPaymentsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public SupplierPaymentsController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: api/SupplierPayments?supplierId=1&search=UTR
        [HttpGet]
        public async Task<IActionResult> GetPayments([FromQuery] long? supplierId, [FromQuery] string? search)
        {
            var query = _context.SupplierPayments.AsNoTracking().AsQueryable();

            if (supplierId.HasValue && supplierId.Value > 0)
                query = query.Where(p => p.SupplierId == supplierId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p =>
                    p.PaymentCode.Contains(term) ||
                    p.SupplierName.Contains(term) ||
                    (p.ReferenceNo != null && p.ReferenceNo.Contains(term)) ||
                    (p.BankAccount != null && p.BankAccount.Contains(term)));
            }

            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .ThenByDescending(p => p.Id)
                .Select(p => new SupplierPaymentResponseDto
                {
                    Id = p.Id,
                    PaymentCode = p.PaymentCode,
                    PaymentDate = p.PaymentDate,
                    SupplierId = p.SupplierId,
                    SupplierName = p.SupplierName,
                    AmountPaid = p.AmountPaid,
                    PaymentMode = p.PaymentMode,
                    ReferenceNo = p.ReferenceNo,
                    BankAccount = p.BankAccount,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        // GET: api/SupplierPayments/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetPayment(long id)
        {
            var p = await _context.SupplierPayments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (p == null)
                return NotFound(new { message = $"Payment record with ID {id} not found." });

            return Ok(new SupplierPaymentResponseDto
            {
                Id = p.Id,
                PaymentCode = p.PaymentCode,
                PaymentDate = p.PaymentDate,
                SupplierId = p.SupplierId,
                SupplierName = p.SupplierName,
                AmountPaid = p.AmountPaid,
                PaymentMode = p.PaymentMode,
                ReferenceNo = p.ReferenceNo,
                BankAccount = p.BankAccount,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt
            });
        }

        // POST: api/SupplierPayments
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] CreateSupplierPaymentDto dto)
        {
            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            var supplierName = !string.IsNullOrWhiteSpace(dto.SupplierName)
                ? dto.SupplierName.Trim()
                : (supplier?.SupplierName ?? supplier?.Name ?? $"Supplier {dto.SupplierId}");

            var code = dto.PaymentCode?.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                var count = await _context.SupplierPayments.CountAsync();
                code = $"SPY-{count + 1:D3}";
            }

            var payment = new SupplierPayment
            {
                PaymentCode = code,
                PaymentDate = dto.PaymentDate ?? DateTime.UtcNow.Date,
                SupplierId = dto.SupplierId,
                SupplierName = supplierName,
                AmountPaid = dto.AmountPaid,
                PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Bank Transfer" : dto.PaymentMode.Trim(),
                ReferenceNo = dto.ReferenceNo?.Trim(),
                BankAccount = string.IsNullOrWhiteSpace(dto.BankAccount) ? "Main Operational Account" : dto.BankAccount.Trim(),
                Notes = dto.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.SupplierPayments.Add(payment);

            // Out-of-the-box enhancement: If this payment references a transaction or if supplier has pending transactions,
            // we can auto-settle the earliest pending transactions!
            var pendingTxs = await _context.SupplierTransactions
                .Where(t => t.SupplierId == dto.SupplierId && t.BalanceAmount > 0)
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.Id)
                .ToListAsync();

            decimal remainingPayment = dto.AmountPaid;
            foreach (var tx in pendingTxs)
            {
                if (remainingPayment <= 0) break;

                var settleAmount = Math.Min(remainingPayment, tx.BalanceAmount);
                tx.PaidAmount += settleAmount;
                tx.BalanceAmount = Math.Max(0m, tx.Amount - tx.PaidAmount);
                tx.PaymentStatus = tx.BalanceAmount == 0 ? "Paid" : "Partially Paid";
                remainingPayment -= settleAmount;
            }

            await _context.SaveChangesAsync();

            var response = new SupplierPaymentResponseDto
            {
                Id = payment.Id,
                PaymentCode = payment.PaymentCode,
                PaymentDate = payment.PaymentDate,
                SupplierId = payment.SupplierId,
                SupplierName = payment.SupplierName,
                AmountPaid = payment.AmountPaid,
                PaymentMode = payment.PaymentMode,
                ReferenceNo = payment.ReferenceNo,
                BankAccount = payment.BankAccount,
                Notes = payment.Notes,
                CreatedAt = payment.CreatedAt
            };

            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, response);
        }

        // DELETE: api/SupplierPayments/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeletePayment(long id)
        {
            var p = await _context.SupplierPayments.FindAsync(id);
            if (p == null)
                return NotFound(new { message = $"Payment record with ID {id} not found." });

            _context.SupplierPayments.Remove(p);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
