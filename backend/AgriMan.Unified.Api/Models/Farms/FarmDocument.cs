using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("farm_documents")]
public class FarmDocument
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FarmId { get; set; }

    [ForeignKey(nameof(FarmId))]
    public Farm? Farm { get; set; }

    [Required]
    [MaxLength(100)]
    public string DocumentType { get; set; } = "Pattadar Passbook"; // Pattadar Passbook, 1B Adangal, Lease Agreement, Survey Map, Title Deed

    [MaxLength(100)]
    public string? DocumentNumber { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? FileUrl { get; set; }

    public long? FileSize { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
