namespace FarmManagementApi.Models
{
    public class CropActivity
    {
        public int Id { get; set; }
        public string ActivityCode { get; set; } = string.Empty;
        public int? FarmId { get; set; }
        public string Farm { get; set; } = string.Empty;
        public int? CropId { get; set; }
        public string Crop { get; set; } = string.Empty;
        public int? SeasonId { get; set; }
        public string Season { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty;
        public DateTime ActivityDate { get; set; } = DateTime.UtcNow;
        public string LabourWorkers { get; set; } = string.Empty;
        public string Machinery { get; set; } = string.Empty;
        public string MaterialsUsed { get; set; } = string.Empty;
        public decimal TotalCost { get; set; } = 0;
        public string Status { get; set; } = "Completed";
        public string Supervisor { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Farm? FarmRef { get; set; }
        public Crop? CropRef { get; set; }
    }
}
