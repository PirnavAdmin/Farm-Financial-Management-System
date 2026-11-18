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

        // GET: api/suppliers?farmerId=1
        [HttpGet]
        public async Task<IActionResult> GetSuppliers([FromQuery] int? farmerId)
        {
            var query = _context.Suppliers.AsQueryable();

            if (farmerId.HasValue)
                query = query.Where(s => s.FarmerId == farmerId.Value);

            var suppliers = await query
                .Select(s => new SupplierResponseDto
                {
                    Id = s.Id,
                    FarmerId = s.FarmerId,
                    Name = s.Name,
                    ContactPerson = s.ContactPerson,
                    Phone = s.Phone,
                    Email = s.Email,
                    Address = s.Address,
                    GstNumber = s.GstNumber
                })
                .ToListAsync();

            return Ok(suppliers);
        }

        // GET: api/suppliers/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetSupplier(long id)
        {
            var s = await _context.Suppliers.FindAsync(id);
            if (s == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            return Ok(new SupplierResponseDto
            {
                Id = s.Id,
                FarmerId = s.FarmerId,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                GstNumber = s.GstNumber
            });
        }

        // POST: api/suppliers
        [HttpPost]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            var farmerExists = await _context.Farmers.AnyAsync(f => f.Id == dto.FarmerId);
            if (!farmerExists)
                return BadRequest(new { message = $"Farmer with ID {dto.FarmerId} does not exist." });

            var supplier = new Supplier
            {
                FarmerId = dto.FarmerId,
                Name = dto.Name,
                ContactPerson = dto.ContactPerson,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address,
                GstNumber = dto.GstNumber
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }

        // PUT: api/suppliers/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateSupplier(long id, [FromBody] CreateSupplierDto dto)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound(new { message = $"Supplier with ID {id} not found." });

            supplier.Name = dto.Name;
            supplier.ContactPerson = dto.ContactPerson;
            supplier.Phone = dto.Phone;
            supplier.Email = dto.Email;
            supplier.Address = dto.Address;
            supplier.GstNumber = dto.GstNumber;

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
                return BadRequest(new { message = "Cannot delete supplier with linked purchase records." });

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}