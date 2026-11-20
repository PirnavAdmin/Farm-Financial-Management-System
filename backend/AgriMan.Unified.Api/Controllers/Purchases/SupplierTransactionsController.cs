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
    public class SupplierTransactionsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public SupplierTransactionsController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: api/SupplierTransactions?supplierId=1&status=Pending
        [HttpGet]
        public async Task<IActionResult> GetTransactions([FromQuery] long? supplierId, [FromQuery] string? status, [FromQuery] string? search)
        {
            var query = _context.SupplierTransactions.AsNoTracking().AsQueryable();

            if (supplierId.HasValue && supplierId.Value > 0)
                query = query.Where(t => t.SupplierId == supplierId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.PaymentStatus == status);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(t =>
                    t.TransactionCode.Contains(term) ||
                    t.SupplierName.Contains(term) ||
                    (t.ReferenceNo != null && t.ReferenceNo.Contains(term)) ||
                    (t.Category != null && t.Category.Contains(term)));
            }

            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .Select(t => new SupplierTransactionResponseDto
                {
                    Id = t.Id,
                    TransactionCode = t.TransactionCode,
                    TransactionDate = t.TransactionDate,
                    SupplierId = t.SupplierId,
                    SupplierName = t.SupplierName,
                    TransactionType = t.TransactionType,
                    ReferenceNo = t.ReferenceNo,
                    Category = t.Category,
                    ItemsSummary = t.ItemsSummary,
                    Amount = t.Amount,
                    PaidAmount = t.PaidAmount,
                    BalanceAmount = t.BalanceAmount,
                    PaymentStatus = t.PaymentStatus,
                    Notes = t.Notes,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(transactions);
        }

        // GET: api/SupplierTransactions/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetTransaction(long id)
        {
            var t = await _context.SupplierTransactions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (t == null)
                return NotFound(new { message = $"Transaction with ID {id} not found." });

            return Ok(new SupplierTransactionResponseDto
            {
                Id = t.Id,
                TransactionCode = t.TransactionCode,
                TransactionDate = t.TransactionDate,
                SupplierId = t.SupplierId,
                SupplierName = t.SupplierName,
                TransactionType = t.TransactionType,
                ReferenceNo = t.ReferenceNo,
                Category = t.Category,
                ItemsSummary = t.ItemsSummary,
                Amount = t.Amount,
                PaidAmount = t.PaidAmount,
                BalanceAmount = t.BalanceAmount,
                PaymentStatus = t.PaymentStatus,
                Notes = t.Notes,
                CreatedAt = t.CreatedAt
            });
        }

        // POST: api/SupplierTransactions
        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateSupplierTransactionDto dto)
        {
            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            var supplierName = !string.IsNullOrWhiteSpace(dto.SupplierName)
                ? dto.SupplierName.Trim()
                : (supplier?.SupplierName ?? supplier?.Name ?? $"Supplier {dto.SupplierId}");

            var code = dto.TransactionCode?.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                var count = await _context.SupplierTransactions.CountAsync();
                code = $"STX-{count + 1:D3}";
            }

            var amount = dto.Amount;
            var paid = dto.PaidAmount;
            var balance = Math.Max(0m, amount - paid);

            var status = dto.PaymentStatus;
            if (paid >= amount && amount > 0)
                status = "Paid";
            else if (paid > 0 && paid < amount)
                status = "Partially Paid";
            else if (paid == 0)
                status = "Pending";

            var tx = new SupplierTransaction
            {
                TransactionCode = code,
                TransactionDate = dto.TransactionDate ?? DateTime.UtcNow.Date,
                SupplierId = dto.SupplierId,
                SupplierName = supplierName,
                TransactionType = string.IsNullOrWhiteSpace(dto.TransactionType) ? "Purchase" : dto.TransactionType.Trim(),
                ReferenceNo = dto.ReferenceNo?.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                ItemsSummary = dto.ItemsSummary?.Trim(),
                Amount = amount,
                PaidAmount = paid,
                BalanceAmount = balance,
                PaymentStatus = status,
                Notes = dto.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.SupplierTransactions.Add(tx);
            await _context.SaveChangesAsync();

            var response = new SupplierTransactionResponseDto
            {
                Id = tx.Id,
                TransactionCode = tx.TransactionCode,
                TransactionDate = tx.TransactionDate,
                SupplierId = tx.SupplierId,
                SupplierName = tx.SupplierName,
                TransactionType = tx.TransactionType,
                ReferenceNo = tx.ReferenceNo,
                Category = tx.Category,
                ItemsSummary = tx.ItemsSummary,
                Amount = tx.Amount,
                PaidAmount = tx.PaidAmount,
                BalanceAmount = tx.BalanceAmount,
                PaymentStatus = tx.PaymentStatus,
                Notes = tx.Notes,
                CreatedAt = tx.CreatedAt
            };

            return CreatedAtAction(nameof(GetTransaction), new { id = tx.Id }, response);
        }

        // DELETE: api/SupplierTransactions/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteTransaction(long id)
        {
            var tx = await _context.SupplierTransactions.FindAsync(id);
            if (tx == null)
                return NotFound(new { message = $"Transaction with ID {id} not found." });

            _context.SupplierTransactions.Remove(tx);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
