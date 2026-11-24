using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Tags("05. Crop & Season Management (Module 5)")]
    public class CropActivitiesController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public CropActivitiesController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CropActivity>>> GetActivities(
            [FromQuery] string? farm,
            [FromQuery] string? crop,
            [FromQuery] string? season,
            [FromQuery] string? activityType,
            [FromQuery] string? status,
            [FromQuery] string? search)
        {
            var query = _context.CropActivities.AsQueryable();

            if (!string.IsNullOrWhiteSpace(farm) && !farm.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Farm.Contains(farm));

            if (!string.IsNullOrWhiteSpace(crop) && !crop.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Crop.Contains(crop));

            if (!string.IsNullOrWhiteSpace(season) && !season.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Season.Contains(season));

            if (!string.IsNullOrWhiteSpace(activityType) && !activityType.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.ActivityType.Contains(activityType));

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(a => a.ActivityCode.Contains(search) || a.ActivityType.Contains(search) || a.Supervisor.Contains(search) || a.Notes.Contains(search));

            return await query.OrderByDescending(a => a.ActivityDate).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CropActivity>> GetActivity(int id)
        {
            var act = await _context.CropActivities.FindAsync(id);
            if (act == null) return NotFound();
            return act;
        }

        [HttpPost]
        public async Task<ActionResult<CropActivity>> CreateActivity([FromBody] CropActivity activity)
        {
            if (string.IsNullOrWhiteSpace(activity.ActivityCode))
            {
                var year = DateTime.UtcNow.Year;
                var count = await _context.CropActivities.CountAsync() + 1;
                activity.ActivityCode = $"ACT-{year}-{count:D2}";
            }
            activity.CreatedAt = DateTime.UtcNow;
            _context.CropActivities.Add(activity);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetActivity), new { id = activity.Id }, activity);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateActivity(int id, [FromBody] CropActivity activity)
        {
            if (id != activity.Id) return BadRequest();
            _context.Entry(activity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(activity);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteActivity(int id)
        {
            var act = await _context.CropActivities.FindAsync(id);
            if (act == null) return NotFound();
            _context.CropActivities.Remove(act);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
