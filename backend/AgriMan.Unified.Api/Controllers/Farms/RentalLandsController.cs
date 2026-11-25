using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Text.Json.Serialization;

namespace FarmManagementApi.Controllers;

public class RentalLandDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public string StorageFileName { get; set; } = string.Empty;
}

public class RentalLandRecord
{
    public int Id { get; set; }
    public int? FarmerId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantCountryCode { get; set; } = "+91";
    public string TenantMobile { get; set; } = string.Empty;
    public string Mobile { get => TenantMobile; set => TenantMobile = value; }
    public string SurveyNumber { get; set; } = string.Empty;
    public string SurveyNo { get => SurveyNumber; set => SurveyNumber = value; }
    public decimal LandArea { get; set; }
    public string AreaUnit { get; set; } = "Acres";
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public decimal RentAmount { get; set; }
    public decimal Rent { get => RentAmount; set => RentAmount = value; }
    public string RentFrequency { get; set; } = "Monthly";
    public string LeaseStartDate { get; set; } = "2026-06-01";
    public string LeaseEndDate { get; set; } = "2027-05-31";
    public string LeasePeriod { get; set; } = "1 Year (2026-2027)";
    public string Status { get; set; } = "Active";
    public string? Remarks { get; set; }
    public List<RentalLandDocument> Documents { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[ApiController]
[Route("api/[controller]")]
[Route("api/RentalLand")]
public class RentalLandsController : ControllerBase
{
    private const long MaxDocumentSize = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"
    };

    private static readonly ConcurrentDictionary<int, RentalLandRecord> _store = new();
    private static int _nextId = 1;
    private readonly IWebHostEnvironment _environment;

    public RentalLandsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    static RentalLandsController()
    {
        // Seed default sample record for farmer 1 (Prathap) if empty
        var sample = new RentalLandRecord
        {
            Id = _nextId++,
            FarmerId = 1,
            TenantName = "Ramesh Naidu",
            TenantMobile = "9848012345",
            SurveyNumber = "SY-142/B",
            LandArea = 15.0m,
            AreaUnit = "Acres",
            Village = "Kankipadu",
            Mandal = "Kankipadu",
            District = "Krishna",
            State = "Andhra Pradesh",
            RentAmount = 45000m,
            RentFrequency = "Monthly",
            LeaseStartDate = "2026-06-01",
            LeaseEndDate = "2027-05-31",
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
        model.Documents = new List<RentalLandDocument>();
        if (string.IsNullOrWhiteSpace(model.TenantMobile) && !string.IsNullOrWhiteSpace(model.Mobile))
            model.TenantMobile = model.Mobile;
        if (string.IsNullOrWhiteSpace(model.SurveyNumber) && !string.IsNullOrWhiteSpace(model.SurveyNo))
            model.SurveyNumber = model.SurveyNo;
        if (model.RentAmount <= 0 && model.Rent > 0)
            model.RentAmount = model.Rent;

        _store[model.Id] = model;
        return CreatedAtAction(nameof(GetById), new { id = model.Id }, model);
    }

    [HttpPut("{id:int}")]
    public ActionResult<RentalLandRecord> Update(int id, [FromBody] RentalLandRecord model)
    {
        if (!_store.TryGetValue(id, out var existingRecord))
        {
            return NotFound(new { message = $"Rental land record with ID {id} not found." });
        }
        model.Id = id;
        model.Documents = existingRecord.Documents;
        model.CreatedAt = existingRecord.CreatedAt;
        if (string.IsNullOrWhiteSpace(model.TenantMobile) && !string.IsNullOrWhiteSpace(model.Mobile))
            model.TenantMobile = model.Mobile;
        if (string.IsNullOrWhiteSpace(model.SurveyNumber) && !string.IsNullOrWhiteSpace(model.SurveyNo))
            model.SurveyNumber = model.SurveyNo;
        if (model.RentAmount <= 0 && model.Rent > 0)
            model.RentAmount = model.Rent;

        _store[id] = model;
        return Ok(model);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!_store.TryGetValue(id, out var record))
        {
            return NotFound(new { message = $"Rental land record with ID {id} not found." });
        }

        foreach (var document in record.Documents)
        {
            var filePath = GetDocumentPath(id, document);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        return _store.TryRemove(id, out _)
            ? Ok(new { message = "Rental land record deleted successfully." })
            : NotFound(new { message = $"Rental land record with ID {id} not found." });
    }

    [Authorize]
    [HttpPost("{id:int}/documents")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxDocumentSize + 1024 * 1024)]
    public async Task<ActionResult<RentalLandDocument>> UploadDocument([FromRoute] int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Choose a non-empty agreement file to upload." });
        }

        if (file.Length > MaxDocumentSize)
        {
            return BadRequest(new { message = "Each agreement file must be 10 MB or smaller." });
        }

        var originalFileName = Path.GetFileName(file.FileName.Replace('\\', '/'));
        var extension = Path.GetExtension(originalFileName);
        if (!AllowedDocumentExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Agreement files must be PDF, Word, JPG, or PNG files." });
        }

        if (!_store.TryGetValue(id, out var record))
        {
            return NotFound(new { message = $"Rental land record with ID {id} not found." });
        }

        var document = new RentalLandDocument
        {
            FileName = originalFileName,
            FileSize = file.Length,
            StorageFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}"
        };
        var filePath = GetDocumentPath(id, document);
        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

        await using (var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream);
        }

        lock (record)
        {
            record.Documents.Add(document);
        }

        return Ok(document);
    }

    [Authorize]
    [HttpGet("{id:int}/documents/{documentId:guid}")]
    public IActionResult DownloadDocument(int id, Guid documentId)
    {
        if (!_store.TryGetValue(id, out var record))
        {
            return NotFound(new { message = $"Rental land record with ID {id} not found." });
        }

        RentalLandDocument? document;
        lock (record)
        {
            document = record.Documents.FirstOrDefault(item => item.Id == documentId);
        }

        if (document == null)
        {
            return NotFound(new { message = "Rental agreement document was not found." });
        }

        var filePath = GetDocumentPath(id, document);
        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "The stored rental agreement file could not be found." });
        }

        return PhysicalFile(filePath, "application/octet-stream", document.FileName);
    }

    private string GetDocumentPath(int rentalLandId, RentalLandDocument document)
    {
        return Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "rental-agreements",
            rentalLandId.ToString(),
            document.StorageFileName);
    }
}
