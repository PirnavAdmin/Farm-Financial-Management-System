namespace FarmManagementApi.Models
{
    public class CropVariety
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int? CropId { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string VarietyName { get; set; } = string.Empty;
        public int DurationDays { get; set; } = 120;
        public string Season { get; set; } = "Kharif";
        public string ExpectedYield { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Crop? Crop { get; set; }
    }
}
