using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models;

[Table("farms")]
public class Farm
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FarmerId { get; set; }

    [ForeignKey(nameof(FarmerId))]
    public Farmer? Farmer { get; set; }

    [Required]
    [MaxLength(150)]
    public string FarmName { get; set; } = string.Empty; // Greenfield Farm, Farm 1, Farm 2, etc.

    [Required]
    [MaxLength(50)]
    public string OwnershipType { get; set; } = "Owned"; // Owned, Leased, Shared

    [Required]
    [MaxLength(100)]
    public string Village { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Mandal { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = "Andhra Pradesh";

    [MaxLength(10)]
    public string? Pincode { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Inactive

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<FarmLandDetail> LandDetails { get; set; } = new List<FarmLandDetail>();

    public ICollection<FarmDocument> Documents { get; set; } = new List<FarmDocument>();
}
