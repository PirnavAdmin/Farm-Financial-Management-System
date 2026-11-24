using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("05. Crop & Season Management (Module 5)")]
    public class CropVarietiesController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public CropVarietiesController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CropVariety>>> GetVarieties(
            [FromQuery] int? cropId,
            [FromQuery] string? search,
            [FromQuery] string? status)
        {
            var query = _context.CropVarieties.Include(v => v.Crop).AsQueryable();

            if (cropId.HasValue)
                query = query.Where(v => v.CropId == cropId.Value);

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(v => v.Status == status);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(v => v.VarietyName.Contains(search) || v.CropName.Contains(search) || v.Code.Contains(search));

            return await query.OrderBy(v => v.Id).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CropVariety>> GetVariety(int id)
        {
            var variety = await _context.CropVarieties.Include(v => v.Crop).FirstOrDefaultAsync(v => v.Id == id);
            if (variety == null) return NotFound();
            return variety;
        }

        [HttpPost]
        public async Task<ActionResult<CropVariety>> CreateVariety([FromBody] CropVariety variety)
        {
            if (string.IsNullOrWhiteSpace(variety.Code))
            {
                var count = await _context.CropVarieties.CountAsync() + 1;
                variety.Code = $"VAR-{count:D3}";
            }
            variety.CreatedAt = DateTime.UtcNow;
            _context.CropVarieties.Add(variety);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetVariety), new { id = variety.Id }, variety);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVariety(int id, [FromBody] CropVariety variety)
        {
            if (id != variety.Id) return BadRequest();
            _context.Entry(variety).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(variety);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVariety(int id)
        {
            var variety = await _context.CropVarieties.FindAsync(id);
            if (variety == null) return NotFound();
            _context.CropVarieties.Remove(variety);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
