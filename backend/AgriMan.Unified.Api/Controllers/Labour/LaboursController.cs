using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LaboursController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public LaboursController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Labour>>> GetLabours()
        {
            return await _context.Labours.OrderByDescending(l => l.Id).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Labour>> GetLabour(ulong id)
        {
            var labour = await _context.Labours.FindAsync(id);
            if (labour == null) return NotFound();
            return labour;
        }

        [HttpPost]
        public async Task<ActionResult<Labour>> CreateLabour([FromBody] Labour labour)
        {
            if (string.IsNullOrEmpty(labour.LabourCode))
            {
                var count = await _context.Labours.CountAsync() + 1;
                labour.LabourCode = $"LBR-{count:D3}";
            }
            labour.CreatedAt = DateTime.UtcNow;
            _context.Labours.Add(labour);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLabour), new { id = labour.Id }, labour);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLabour(ulong id, [FromBody] Labour labour)
        {
            if (id != labour.Id) return BadRequest();
            labour.UpdatedAt = DateTime.UtcNow;
            _context.Entry(labour).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Labours.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLabour(ulong id)
        {
            var labour = await _context.Labours.FindAsync(id);
            if (labour == null) return NotFound();
            _context.Labours.Remove(labour);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LabourWorkTypesController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public LabourWorkTypesController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LabourWorkType>>> GetWorkTypes()
        {
            return await _context.LabourWorkTypes.OrderBy(w => w.Id).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<LabourWorkType>> CreateWorkType([FromBody] LabourWorkType workType)
        {
            if (string.IsNullOrEmpty(workType.Code))
            {
                var count = await _context.LabourWorkTypes.CountAsync() + 1;
                workType.Code = $"LWT-{count:D3}";
            }
            _context.LabourWorkTypes.Add(workType);
            await _context.SaveChangesAsync();
            return Ok(workType);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkType(ulong id, [FromBody] LabourWorkType workType)
        {
            if (id != workType.Id) return BadRequest();
            _context.Entry(workType).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkType(ulong id)
        {
            var item = await _context.LabourWorkTypes.FindAsync(id);
            if (item == null) return NotFound();
            _context.LabourWorkTypes.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LabourAttendanceController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public LabourAttendanceController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LabourAttendance>>> GetAttendance()
        {
            return await _context.LabourAttendances.OrderByDescending(a => a.AttendanceDate).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<LabourAttendance>> CreateAttendance([FromBody] LabourAttendance attendance)
        {
            if (string.IsNullOrEmpty(attendance.AttendanceCode))
            {
                var count = await _context.LabourAttendances.CountAsync() + 1;
                attendance.AttendanceCode = $"ATT-{count:D3}";
            }
            _context.LabourAttendances.Add(attendance);
            await _context.SaveChangesAsync();
            return Ok(attendance);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(ulong id, [FromBody] LabourAttendance attendance)
        {
            if (id != attendance.Id) return BadRequest();
            _context.Entry(attendance).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(ulong id)
        {
            var item = await _context.LabourAttendances.FindAsync(id);
            if (item == null) return NotFound();
            _context.LabourAttendances.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LabourPaymentsController : ControllerBase
    {
        private readonly FarmDbContext _context;

        public LabourPaymentsController(FarmDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LabourPayment>>> GetPayments()
        {
            return await _context.LabourPayments.OrderByDescending(p => p.PaymentDate).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<LabourPayment>> CreatePayment([FromBody] LabourPayment payment)
        {
            if (string.IsNullOrEmpty(payment.PaymentCode))
            {
                var count = await _context.LabourPayments.CountAsync() + 1;
                payment.PaymentCode = $"LPY-{count:D3}";
            }
            _context.LabourPayments.Add(payment);
            await _context.SaveChangesAsync();
            return Ok(payment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(ulong id, [FromBody] LabourPayment payment)
        {
            if (id != payment.Id) return BadRequest();
            _context.Entry(payment).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(ulong id)
        {
            var item = await _context.LabourPayments.FindAsync(id);
            if (item == null) return NotFound();
            _context.LabourPayments.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
