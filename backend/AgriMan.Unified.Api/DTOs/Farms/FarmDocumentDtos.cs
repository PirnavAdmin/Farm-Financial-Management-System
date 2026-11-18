using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs;

public class FarmDocumentDto
{
    public int Id { get; set; }
    public int FarmId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string? DocumentNumber { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class CreateFarmDocumentRequest
{
    [Required]
    public int FarmId { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentType { get; set; } = "Pattadar Passbook";

    [MaxLength(100)]
    public string? DocumentNumber { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? FileUrl { get; set; }

    public long? FileSize { get; set; }
}

public class LookupItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
