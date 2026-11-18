using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FarmerAddressesController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public FarmerAddressesController(FarmDbContext context)
        {
            _context = context;
        }

        // GET: /api/FarmerAddresses
        [HttpGet]
        public async Task<IActionResult> GetFarmerAddresses()
        {
            var addresses = await _context.FarmerAddresses
                .AsNoTracking()
                .ToListAsync();

            return Ok(addresses);
        }

        // POST: /api/FarmerAddresses
        [HttpPost]
        public async Task<IActionResult> PostFarmerAddress([FromBody] CreateFarmerAddressDto dto)
        {
            var farmer = await _context.Farmers.FindAsync(dto.FarmerId);
            if (farmer == null)
            {
                return BadRequest(new { message = $"Farmer with ID {dto.FarmerId} does not exist." });
            }

            var existingAddress = await _context.FarmerAddresses.FirstOrDefaultAsync(a => a.FarmerId == dto.FarmerId);
            if (existingAddress != null)
            {
                return BadRequest(new { message = $"Address already exists for Farmer ID {dto.FarmerId}. Use PUT to update." });
            }

            var address = new FarmerAddress
            {
                FarmerId = dto.FarmerId,
                Address = dto.Address?.Trim(),
                Village = dto.Village.Trim(),
                Mandal = dto.Mandal.Trim(),
                District = dto.District.Trim(),
                State = dto.State.Trim(),
                PinCode = dto.PinCode.Trim()
            };

            _context.FarmerAddresses.Add(address);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFarmerAddress), new { id = address.Id }, address);
        }

        // GET: /api/FarmerAddresses/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFarmerAddress(int id)
        {
            var address = await _context.FarmerAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id || a.FarmerId == id);

            if (address == null)
            {
                return NotFound();
            }

            return Ok(address);
        }

        // PUT: /api/FarmerAddresses/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFarmerAddress(int id, [FromBody] CreateFarmerAddressDto dto)
        {
            var address = await _context.FarmerAddresses.FirstOrDefaultAsync(a => a.Id == id || a.FarmerId == id);
            if (address == null)
            {
                return NotFound();
            }

            address.Address = dto.Address?.Trim();
            address.Village = dto.Village.Trim();
            address.Mandal = dto.Mandal.Trim();
            address.District = dto.District.Trim();
            address.State = dto.State.Trim();
            address.PinCode = dto.PinCode.Trim();

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: /api/FarmerAddresses/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFarmerAddress(int id)
        {
            var address = await _context.FarmerAddresses.FirstOrDefaultAsync(a => a.Id == id || a.FarmerId == id);
            if (address == null)
            {
                return NotFound();
            }

            _context.FarmerAddresses.Remove(address);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
