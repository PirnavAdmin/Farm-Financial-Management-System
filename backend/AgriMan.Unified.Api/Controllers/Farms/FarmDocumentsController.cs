using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmManagementApi.Data;
using FarmManagementApi.DTOs;
using FarmManagementApi.Models;

namespace FarmManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmDocumentsController : ControllerBase
{
    private readonly FarmDbContext _context;
    private readonly IWebHostEnvironment _env;

    public FarmDocumentsController(FarmDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet("farm/{farmId:int}")]
    public async Task<ActionResult<IEnumerable<FarmDocumentDto>>> GetDocumentsByFarm(int farmId)
    {
        var documents = await _context.FarmDocuments
            .Where(d => d.FarmId == farmId)
            .OrderByDescending(d => d.UploadedAt)
            .AsNoTracking()
            .ToListAsync();

        var result = documents.Select(d => new FarmDocumentDto
        {
            Id = d.Id,
            FarmId = d.FarmId,
            DocumentType = d.DocumentType,
            DocumentNumber = d.DocumentNumber,
            FileName = d.FileName,
            FileUrl = d.FileUrl,
            FileSize = d.FileSize,
            UploadedAt = d.UploadedAt
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<FarmDocumentDto>> AddDocumentMetadata([FromBody] CreateFarmDocumentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var farmExists = await _context.Farms.AnyAsync(f => f.Id == request.FarmId);
        if (!farmExists)
        {
            return BadRequest(new { message = $"Farm with ID {request.FarmId} does not exist." });
        }

        var doc = new FarmDocument
        {
            FarmId = request.FarmId,
            DocumentType = request.DocumentType.Trim(),
            DocumentNumber = request.DocumentNumber?.Trim(),
            FileName = request.FileName.Trim(),
            FileUrl = request.FileUrl?.Trim(),
            FileSize = request.FileSize,
            UploadedAt = DateTime.UtcNow
        };

        _context.FarmDocuments.Add(doc);
        await _context.SaveChangesAsync();

        var dto = new FarmDocumentDto
        {
            Id = doc.Id,
            FarmId = doc.FarmId,
            DocumentType = doc.DocumentType,
            DocumentNumber = doc.DocumentNumber,
            FileName = doc.FileName,
            FileUrl = doc.FileUrl,
            FileSize = doc.FileSize,
            UploadedAt = doc.UploadedAt
        };

        return Ok(dto);
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FarmDocumentDto>> UploadDocument(
        [FromForm] int farmId,
        [FromForm] string documentType,
        [FromForm] string? documentNumber,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        var farmExists = await _context.Farms.AnyAsync(f => f.Id == farmId);
        if (!farmExists)
        {
            return BadRequest(new { message = $"Farm with ID {farmId} does not exist." });
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", "documents");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var safeFileName = $"{Guid.NewGuid():N}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadDir, safeFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var doc = new FarmDocument
        {
            FarmId = farmId,
            DocumentType = documentType.Trim(),
            DocumentNumber = documentNumber?.Trim(),
            FileName = file.FileName,
            FileUrl = $"/uploads/documents/{safeFileName}",
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow
        };

        _context.FarmDocuments.Add(doc);
        await _context.SaveChangesAsync();

        return Ok(new FarmDocumentDto
        {
            Id = doc.Id,
            FarmId = doc.FarmId,
            DocumentType = doc.DocumentType,
            DocumentNumber = doc.DocumentNumber,
            FileName = doc.FileName,
            FileUrl = doc.FileUrl,
            FileSize = doc.FileSize,
            UploadedAt = doc.UploadedAt
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDocument(int id)
    {
        var doc = await _context.FarmDocuments.FindAsync(id);
        if (doc == null)
        {
            return NotFound(new { message = $"Document with ID {id} not found." });
        }

        _context.FarmDocuments.Remove(doc);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Document removed successfully." });
    }
}
