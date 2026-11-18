using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("crops")]
    public class Crop
    {
        [Key]
        public int Id { get; set; }

        public int? CategoryId { get; set; }

        [Required]
        [MaxLength(50)]
        public string CropCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CropName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string CropType { get; set; } = "Kharif";

        [MaxLength(20)]
        public string DefaultUnit { get; set; } = "Bags";

        public int? DurationDays { get; set; } = 120;

        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual CropCategory? Category { get; set; }
    }

    [Table("crop_categories")]
    public class CropCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; }
    }

    [Table("crop_seasons")]
    public class CropSeason
    {
        [Key]
        public int Id { get; set; }

        public int FarmId { get; set; }
        public int CropId { get; set; }

        [Required]
        [MaxLength(100)]
        public string SeasonName { get; set; } = string.Empty;

        public DateTime SowingDate { get; set; }
        public DateTime? ExpectedHarvestDate { get; set; }
        public DateTime? ActualHarvestDate { get; set; }

        public decimal AreaAcres { get; set; }
        public decimal? ExpectedYield { get; set; }
        public decimal? ExpectedRevenue { get; set; }
        public decimal? ActualYield { get; set; }
        public decimal? ActualRevenue { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "In Progress";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Farm? Farm { get; set; }
        public virtual Crop? Crop { get; set; }
    }
}
