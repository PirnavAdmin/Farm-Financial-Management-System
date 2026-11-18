using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FarmerBankAccountsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public FarmerBankAccountsController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: /api/FarmerBankAccounts
        [HttpGet]
        public async Task<IActionResult> GetFarmerBankAccounts()
        {
            var accounts = await _context.FarmerBankAccounts
                .AsNoTracking()
                .ToListAsync();

            return Ok(accounts);
        }

        // POST: /api/FarmerBankAccounts
        [HttpPost]
        public async Task<IActionResult> PostFarmerBankAccount([FromBody] CreateFarmerBankAccountDto dto)
        {
            var farmer = await _context.Farmers.FindAsync(dto.FarmerId);
            if (farmer == null)
            {
                return BadRequest(new { message = $"Farmer with ID {dto.FarmerId} does not exist." });
            }

            var existingBank = await _context.FarmerBankAccounts.FirstOrDefaultAsync(b => b.FarmerId == dto.FarmerId);
            if (existingBank != null)
            {
                return BadRequest(new { message = $"Bank account already exists for Farmer ID {dto.FarmerId}. Use PUT to update." });
            }

            var bank = new FarmerBankAccount
            {
                FarmerId = dto.FarmerId,
                BankName = dto.BankName.Trim(),
                AccountNumber = dto.AccountNumber.Trim(),
                IFSC = dto.IFSC.Trim().ToUpperInvariant()
            };

            _context.FarmerBankAccounts.Add(bank);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFarmerBankAccount), new { id = bank.Id }, bank);
        }

        // GET: /api/FarmerBankAccounts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFarmerBankAccount(int id)
        {
            var bank = await _context.FarmerBankAccounts
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id || b.FarmerId == id);

            if (bank == null)
            {
                return NotFound();
            }

            return Ok(bank);
        }

        // PUT: /api/FarmerBankAccounts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFarmerBankAccount(int id, [FromBody] CreateFarmerBankAccountDto dto)
        {
            var bank = await _context.FarmerBankAccounts.FirstOrDefaultAsync(b => b.Id == id || b.FarmerId == id);
            if (bank == null)
            {
                return NotFound();
            }

            bank.BankName = dto.BankName.Trim();
            bank.AccountNumber = dto.AccountNumber.Trim();
            bank.IFSC = dto.IFSC.Trim().ToUpperInvariant();

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: /api/FarmerBankAccounts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFarmerBankAccount(int id)
        {
            var bank = await _context.FarmerBankAccounts.FirstOrDefaultAsync(b => b.Id == id || b.FarmerId == id);
            if (bank == null)
            {
                return NotFound();
            }

            _context.FarmerBankAccounts.Remove(bank);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
