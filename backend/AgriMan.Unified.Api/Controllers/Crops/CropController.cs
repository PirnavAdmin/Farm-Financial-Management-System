using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CropController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public CropController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Crop>>> GetCrops()
        {
            return await _context.Crops.Include(c => c.Category).OrderBy(c => c.Id).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Crop>> GetCrop(int id)
        {
            var crop = await _context.Crops.Include(c => c.Category).FirstOrDefaultAsync(c => c.Id == id);
            if (crop == null) return NotFound();
            return crop;
        }

        [HttpPost]
        public async Task<ActionResult<Crop>> CreateCrop([FromBody] Crop crop)
        {
            if (string.IsNullOrEmpty(crop.CropCode))
            {
                var count = await _context.Crops.CountAsync() + 1;
                crop.CropCode = $"CRP-{count:D3}";
            }
            crop.CreatedAt = DateTime.UtcNow;
            _context.Crops.Add(crop);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCrop), new { id = crop.Id }, crop);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCrop(int id, [FromBody] Crop crop)
        {
            if (id != crop.Id) return BadRequest();
            _context.Entry(crop).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCrop(int id)
        {
            var crop = await _context.Crops.FindAsync(id);
            if (crop == null) return NotFound();
            _context.Crops.Remove(crop);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var crop = await _context.Crops.FindAsync(id);
            if (crop == null) return NotFound();
            crop.Status = status;
            await _context.SaveChangesAsync();
            return Ok(crop);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CropCategoryController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public CropCategoryController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CropCategory>>> GetCategories()
        {
            return await _context.CropCategories.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<CropCategory>> CreateCategory([FromBody] CropCategory category)
        {
            _context.CropCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CropSeasonController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public CropSeasonController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CropSeason>>> GetSeasons()
        {
            return await _context.CropSeasons.Include(s => s.Farm).Include(s => s.Crop).OrderByDescending(s => s.Id).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<CropSeason>> CreateSeason([FromBody] CropSeason season)
        {
            season.CreatedAt = DateTime.UtcNow;
            _context.CropSeasons.Add(season);
            await _context.SaveChangesAsync();
            return Ok(season);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSeason(int id, [FromBody] CropSeason season)
        {
            if (id != season.Id) return BadRequest();
            _context.Entry(season).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeason(int id)
        {
            var item = await _context.CropSeasons.FindAsync(id);
            if (item == null) return NotFound();
            _context.CropSeasons.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
