using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace FarmManagementApi.Controllers;

public class RentalLandRecord
{
    public int Id { get; set; }
    public int? FarmerId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string SurveyNo { get; set; } = string.Empty;
    public decimal LandArea { get; set; }
    public string AreaUnit { get; set; } = "acres";
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public decimal Rent { get; set; }
    public string LeasePeriod { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[ApiController]
[Route("api/[controller]")]
[Route("api/RentalLand")]
public class RentalLandsController : ControllerBase
{
    private static readonly ConcurrentDictionary<int, RentalLandRecord> _store = new();
    private static int _nextId = 1;

    static RentalLandsController()
    {
        // Seed default sample record for farmer 1 (Prathap) if empty
        var sample = new RentalLandRecord
        {
            Id = _nextId++,
            FarmerId = 1,
            TenantName = "Ramesh Naidu",
            Mobile = "9848012345",
            SurveyNo = "SY-142/B",
            LandArea = 15.0m,
            AreaUnit = "acres",
            Village = "Kankipadu",
            Mandal = "Kankipadu",
            District = "Krishna",
            Rent = 45000m,
            LeasePeriod = "1 Year (2026-2027)",
            Status = "Active",
            Remarks = "Leased for Paddy Kharif cultivation",
            CreatedAt = DateTime.UtcNow
        };
        _store[sample.Id] = sample;
    }

    [HttpGet]
    public ActionResult<IEnumerable<RentalLandRecord>> GetAll([FromQuery] int? farmerId = null)
    {
        var records = _store.Values.AsEnumerable();
        if (farmerId.HasValue && farmerId.Value > 0)
        {
            records = records.Where(r => r.FarmerId == farmerId.Value);
        }
        return Ok(records.OrderByDescending(r => r.Id).ToList());
    }

    [HttpGet("{id:int}")]
    public ActionResult<RentalLandRecord> GetById(int id)
    {
        if (_store.TryGetValue(id, out var record))
        {
            return Ok(record);
        }
        return NotFound(new { message = $"Rental land record with ID {id} not found." });
    }

    [HttpGet("farmer/{farmerId:int}")]
    public ActionResult<IEnumerable<RentalLandRecord>> GetByFarmer(int farmerId)
    {
        var list = _store.Values.Where(r => r.FarmerId == farmerId).OrderByDescending(r => r.Id).ToList();
        return Ok(list);
    }

    [HttpPost]
    public ActionResult<RentalLandRecord> Create([FromBody] RentalLandRecord model)
    {
        model.Id = Interlocked.Increment(ref _nextId);
        model.CreatedAt = DateTime.UtcNow;
        _store[model.Id] = model;
        return CreatedAtAction(nameof(GetById), new { id = model.Id }, model);
    }

    [HttpPut("{id:int}")]
    public ActionResult<RentalLandRecord> Update(int id, [FromBody] RentalLandRecord model)
    {
        if (!_store.ContainsKey(id))
        {
            return NotFound(new { message = $"Rental land record with ID {id} not found." });
        }
        model.Id = id;
        _store[id] = model;
        return Ok(model);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (_store.TryRemove(id, out _))
        {
            return Ok(new { message = "Rental land record deleted successfully." });
        }
        return NotFound(new { message = $"Rental land record with ID {id} not found." });
    }
}
