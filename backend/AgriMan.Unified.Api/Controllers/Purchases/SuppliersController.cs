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
    public class SuppliersController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public SuppliersController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: api/suppliers?farmerId=1&search=seed&status=Active
        [HttpGet]
        public async Task<IActionResult> GetSuppliers([FromQuery] int? farmerId, [FromQuery] string? search, [FromQuery] string? status)
        {
            var query = _context.Suppliers.AsNoTracking().AsQueryable();

            if (farmerId.HasValue && farmerId.Value > 0)
                query = query.Where(s => s.FarmerId == farmerId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.Status == status);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(s =>
                    s.SupplierName.Contains(term) ||
                    (s.Name != null && s.Name.Contains(term)) ||
                    s.SupplierCode.Contains(term) ||
                    s.Mobile.Contains(term) ||
                    (s.Phone != null && s.Phone.Contains(term)) ||
                    s.SupplierType.Contains(term));
            }

            var suppliers = await query
                .OrderBy(s => s.Id)
                .Select(s => new SupplierResponseDto
                {
                    Id = s.Id,
                    FarmerId = s.FarmerId,
                    SupplierCode = string.IsNullOrWhiteSpace(s.SupplierCode) ? $"SUP-{s.Id:D3}" : s.SupplierCode,
                    SupplierName = string.IsNullOrWhiteSpace(s.SupplierName) ? (s.Name ?? $"Supplier {s.Id}") : s.SupplierName,
                    Name = string.IsNullOrWhiteSpace(s.Name) ? (s.SupplierName ?? $"Supplier {s.Id}") : s.Name,
                    SupplierType = string.IsNullOrWhiteSpace(s.SupplierType) ? "General" : s.SupplierType,
                    Mobile = string.IsNullOrWhiteSpace(s.Mobile) ? (s.Phone ?? "") : s.Mobile,
                    ContactPerson = s.ContactPerson,
                    Phone = string.IsNullOrWhiteSpace(s.Phone) ? (s.Mobile ?? "") : s.Phone,
                    Email = s.Email,
                    Address = s.Address,
                    City = s.City,
                    District = s.District,
                    State = s.State ?? "Andhra Pradesh",
                    PinCode = s.PinCode,
                    Gstin = s.Gstin ?? s.GstNumber,
                    GstNumber = s.GstNumber ?? s.Gstin,
                    BankName = s.BankName,
                    AccountNumber = s.AccountNumber,
                    IfscCode = s.IfscCode,
                    BranchName = s.BranchName,
                    OpeningBalance = s.OpeningBalance,
                    Status = s.Status,
                    Notes = s.Notes,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(suppliers);
        }

        // GET: api/suppliers/summary
        [HttpGet("summary")]
        public async Task<ActionResult<SupplierSummaryDto>> GetSummary()
        {
            var suppliers = await _context.Suppliers.AsNoTracking().ToListAsync();
            var totalTx = await _context.SupplierTransactions.AsNoTracking().SumAsync(t => (decimal?)t.Amount) ?? 0m;
            var totalPaid = await _context.SupplierPayments.AsNoTracking().SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;
            var totalOpening = suppliers.Sum(s => s.OpeningBalance);

            var summary = new SupplierSummaryDto
            {
                TotalSuppliers = suppliers.Count,
                ActiveSuppliers = suppliers.Count(s => s.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)),
                InactiveSuppliers = suppliers.Count(s => !s.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)),
                TotalOpeningBalance = totalOpening,
                TotalPurchases = totalTx,
                TotalPayments = totalPaid,
                TotalOutstandingPayables = Math.Max(0m, totalOpening + totalTx - totalPaid)
            };

            return Ok(summary);
        }

        // GET: api/suppliers/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetSupplier(long id)
        {
            var s = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (s == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            return Ok(new SupplierResponseDto
            {
                Id = s.Id,
                FarmerId = s.FarmerId,
                SupplierCode = string.IsNullOrWhiteSpace(s.SupplierCode) ? $"SUP-{s.Id:D3}" : s.SupplierCode,
                SupplierName = string.IsNullOrWhiteSpace(s.SupplierName) ? (s.Name ?? $"Supplier {s.Id}") : s.SupplierName,
                Name = string.IsNullOrWhiteSpace(s.Name) ? (s.SupplierName ?? $"Supplier {s.Id}") : s.Name,
                SupplierType = string.IsNullOrWhiteSpace(s.SupplierType) ? "General" : s.SupplierType,
                Mobile = string.IsNullOrWhiteSpace(s.Mobile) ? (s.Phone ?? "") : s.Mobile,
                ContactPerson = s.ContactPerson,
                Phone = string.IsNullOrWhiteSpace(s.Phone) ? (s.Mobile ?? "") : s.Phone,
                Email = s.Email,
                Address = s.Address,
                City = s.City,
                District = s.District,
                State = s.State ?? "Andhra Pradesh",
                PinCode = s.PinCode,
                Gstin = s.Gstin ?? s.GstNumber,
                GstNumber = s.GstNumber ?? s.Gstin,
                BankName = s.BankName,
                AccountNumber = s.AccountNumber,
                IfscCode = s.IfscCode,
                BranchName = s.BranchName,
                OpeningBalance = s.OpeningBalance,
                Status = s.Status,
                Notes = s.Notes,
                CreatedAt = s.CreatedAt
            });
        }

        // GET: api/suppliers/5/ledger
        [HttpGet("{id:long}/ledger")]
        public async Task<ActionResult<SupplierLedgerResponseDto>> GetSupplierLedger(long id)
        {
            var s = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (s == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            var transactions = await _context.SupplierTransactions
                .AsNoTracking()
                .Where(t => t.SupplierId == id)
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.Id)
                .ToListAsync();

            var payments = await _context.SupplierPayments
                .AsNoTracking()
                .Where(p => p.SupplierId == id)
                .OrderBy(p => p.PaymentDate)
                .ThenBy(p => p.Id)
                .ToListAsync();

            var ledgerEntries = new List<SupplierLedgerItemDto>();
            decimal runningBalance = s.OpeningBalance;

            if (s.OpeningBalance > 0)
            {
                ledgerEntries.Add(new SupplierLedgerItemDto
                {
                    Date = s.CreatedAt.Date,
                    TransactionType = "Opening Balance",
                    Code = s.SupplierCode,
                    ReferenceNo = "-",
                    Description = "Initial Account Opening Balance",
                    Debit = s.OpeningBalance,
                    Credit = 0m,
                    Balance = runningBalance
                });
            }

            var mergedEvents = new List<(DateTime Date, string Kind, SupplierTransaction? Tx, SupplierPayment? Pay)>();

            foreach (var tx in transactions)
                mergedEvents.Add((tx.TransactionDate, "Tx", tx, null));

            foreach (var pay in payments)
                mergedEvents.Add((pay.PaymentDate, "Pay", null, pay));

            mergedEvents = mergedEvents.OrderBy(e => e.Date).ToList();

            foreach (var evt in mergedEvents)
            {
                if (evt.Kind == "Tx" && evt.Tx != null)
                {
                    runningBalance += evt.Tx.Amount;
                    ledgerEntries.Add(new SupplierLedgerItemDto
                    {
                        Date = evt.Tx.TransactionDate,
                        TransactionType = evt.Tx.TransactionType,
                        Code = evt.Tx.TransactionCode,
                        ReferenceNo = evt.Tx.ReferenceNo,
                        Description = string.IsNullOrWhiteSpace(evt.Tx.ItemsSummary) ? $"{evt.Tx.Category} Purchase" : evt.Tx.ItemsSummary,
                        Debit = evt.Tx.Amount,
                        Credit = 0m,
                        Balance = runningBalance,
                        PaymentMode = null
                    });
                }
                else if (evt.Kind == "Pay" && evt.Pay != null)
                {
                    runningBalance -= evt.Pay.AmountPaid;
                    ledgerEntries.Add(new SupplierLedgerItemDto
                    {
                        Date = evt.Pay.PaymentDate,
                        TransactionType = "Payment Out",
                        Code = evt.Pay.PaymentCode,
                        ReferenceNo = evt.Pay.ReferenceNo,
                        Description = $"Settlement via {evt.Pay.PaymentMode} ({evt.Pay.BankAccount})",
                        Debit = 0m,
                        Credit = evt.Pay.AmountPaid,
                        Balance = runningBalance,
                        PaymentMode = evt.Pay.PaymentMode
                    });
                }
            }

            var totalDebits = ledgerEntries.Sum(e => e.Debit);
            var totalCredits = ledgerEntries.Sum(e => e.Credit);

            return Ok(new SupplierLedgerResponseDto
            {
                SupplierId = s.Id,
                SupplierCode = s.SupplierCode,
                SupplierName = s.SupplierName,
                OpeningBalance = s.OpeningBalance,
                TotalDebits = totalDebits,
                TotalCredits = totalCredits,
                NetOutstandingBalance = runningBalance,
                Ledger = ledgerEntries
            });
        }

        // POST: api/suppliers
        [HttpPost]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            var displayName = !string.IsNullOrWhiteSpace(dto.SupplierName)
                ? dto.SupplierName.Trim()
                : (!string.IsNullOrWhiteSpace(dto.Name) ? dto.Name.Trim() : "Supplier");

            var mobile = !string.IsNullOrWhiteSpace(dto.Mobile)
                ? dto.Mobile.Trim()
                : (!string.IsNullOrWhiteSpace(dto.Phone) ? dto.Phone.Trim() : "0000000000");

            var gstin = !string.IsNullOrWhiteSpace(dto.Gstin)
                ? dto.Gstin.Trim().ToUpperInvariant()
                : (!string.IsNullOrWhiteSpace(dto.GstNumber) ? dto.GstNumber.Trim().ToUpperInvariant() : null);

            var code = dto.SupplierCode?.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                var count = await _context.Suppliers.CountAsync();
                code = $"SUP-{count + 1:D3}";
            }

            var supplier = new Supplier
            {
                FarmerId = dto.FarmerId > 0 ? dto.FarmerId : 1,
                SupplierCode = code,
                SupplierName = displayName,
                Name = displayName,
                SupplierType = string.IsNullOrWhiteSpace(dto.SupplierType) ? "General" : dto.SupplierType.Trim(),
                Mobile = mobile,
                Phone = mobile,
                ContactPerson = dto.ContactPerson?.Trim(),
                Email = dto.Email?.Trim(),
                Address = string.IsNullOrWhiteSpace(dto.Address) ? "Default Address" : dto.Address.Trim(),
                City = dto.City?.Trim(),
                District = dto.District?.Trim(),
                State = string.IsNullOrWhiteSpace(dto.State) ? "Andhra Pradesh" : dto.State.Trim(),
                PinCode = dto.PinCode?.Trim(),
                Gstin = gstin,
                GstNumber = gstin,
                BankName = dto.BankName?.Trim(),
                AccountNumber = dto.AccountNumber?.Trim(),
                IfscCode = dto.IfscCode?.Trim()?.ToUpperInvariant(),
                BranchName = dto.BranchName?.Trim(),
                OpeningBalance = dto.OpeningBalance,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                Notes = dto.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            var response = new SupplierResponseDto
            {
                Id = supplier.Id,
                FarmerId = supplier.FarmerId,
                SupplierCode = supplier.SupplierCode,
                SupplierName = supplier.SupplierName,
                Name = supplier.Name,
                SupplierType = supplier.SupplierType,
                Mobile = supplier.Mobile,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address,
                City = supplier.City,
                District = supplier.District,
                State = supplier.State,
                PinCode = supplier.PinCode,
                Gstin = supplier.Gstin,
                GstNumber = supplier.GstNumber,
                BankName = supplier.BankName,
                AccountNumber = supplier.AccountNumber,
                IfscCode = supplier.IfscCode,
                BranchName = supplier.BranchName,
                OpeningBalance = supplier.OpeningBalance,
                Status = supplier.Status,
                Notes = supplier.Notes,
                CreatedAt = supplier.CreatedAt
            };

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, response);
        }

        // PUT: api/suppliers/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateSupplier(long id, [FromBody] CreateSupplierDto dto)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            var displayName = !string.IsNullOrWhiteSpace(dto.SupplierName)
                ? dto.SupplierName.Trim()
                : (!string.IsNullOrWhiteSpace(dto.Name) ? dto.Name.Trim() : supplier.SupplierName);

            var mobile = !string.IsNullOrWhiteSpace(dto.Mobile)
                ? dto.Mobile.Trim()
                : (!string.IsNullOrWhiteSpace(dto.Phone) ? dto.Phone.Trim() : supplier.Mobile);

            var gstin = !string.IsNullOrWhiteSpace(dto.Gstin)
                ? dto.Gstin.Trim().ToUpperInvariant()
                : (!string.IsNullOrWhiteSpace(dto.GstNumber) ? dto.GstNumber.Trim().ToUpperInvariant() : supplier.Gstin);

            if (!string.IsNullOrWhiteSpace(dto.SupplierCode))
                supplier.SupplierCode = dto.SupplierCode.Trim();

            supplier.SupplierName = displayName;
            supplier.Name = displayName;
            supplier.SupplierType = string.IsNullOrWhiteSpace(dto.SupplierType) ? supplier.SupplierType : dto.SupplierType.Trim();
            supplier.Mobile = mobile;
            supplier.Phone = mobile;
            supplier.ContactPerson = dto.ContactPerson ?? supplier.ContactPerson;
            supplier.Email = dto.Email ?? supplier.Email;
            supplier.Address = string.IsNullOrWhiteSpace(dto.Address) ? supplier.Address : dto.Address.Trim();
            supplier.City = dto.City ?? supplier.City;
            supplier.District = dto.District ?? supplier.District;
            supplier.State = dto.State ?? supplier.State;
            supplier.PinCode = dto.PinCode ?? supplier.PinCode;
            supplier.Gstin = gstin;
            supplier.GstNumber = gstin;
            supplier.BankName = dto.BankName ?? supplier.BankName;
            supplier.AccountNumber = dto.AccountNumber ?? supplier.AccountNumber;
            supplier.IfscCode = dto.IfscCode ?? supplier.IfscCode;
            supplier.BranchName = dto.BranchName ?? supplier.BranchName;
            supplier.OpeningBalance = dto.OpeningBalance;
            supplier.Status = string.IsNullOrWhiteSpace(dto.Status) ? supplier.Status : dto.Status.Trim();
            supplier.Notes = dto.Notes ?? supplier.Notes;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/suppliers/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteSupplier(long id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            var hasPurchases = await _context.Purchases.AnyAsync(p => p.SupplierId == id);
            if (hasPurchases)
                return BadRequest(new { message = "Cannot delete supplier with linked purchase orders." });

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
