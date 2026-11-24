using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("11. Finance, Bank Accounts & Reports (Module 11)")]
    public class BankAccountsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public BankAccountsController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BankAccount>>> GetBankAccounts(
            [FromQuery] string? search,
            [FromQuery] string? accountType,
            [FromQuery] string? status)
        {
            var query = _context.BankAccounts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(accountType) && !accountType.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(b => b.AccountType == accountType);

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(b => b.Status == status);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(b => b.BankName.Contains(search) || b.AccountName.Contains(search) || b.AccountNumber.Contains(search) || b.Branch.Contains(search));

            return await query.OrderBy(b => b.Id).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BankAccount>> GetBankAccount(int id)
        {
            var account = await _context.BankAccounts.FindAsync(id);
            if (account == null) return NotFound();
            return account;
        }

        [HttpPost]
        public async Task<ActionResult<BankAccount>> CreateBankAccount([FromBody] BankAccount account)
        {
            account.CreatedAt = DateTime.UtcNow;
            if (account.CurrentBalance == 0 && account.OpeningBalance > 0)
                account.CurrentBalance = account.OpeningBalance;

            _context.BankAccounts.Add(account);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBankAccount), new { id = account.Id }, account);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBankAccount(int id, [FromBody] BankAccount account)
        {
            if (id != account.Id) return BadRequest();
            account.UpdatedAt = DateTime.UtcNow;
            _context.Entry(account).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(account);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBankAccount(int id)
        {
            var account = await _context.BankAccounts.FindAsync(id);
            if (account == null) return NotFound();
            _context.BankAccounts.Remove(account);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
