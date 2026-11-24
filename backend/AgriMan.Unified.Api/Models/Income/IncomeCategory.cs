namespace FarmManagementApi.Models
{
    public class IncomeCategory
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Source { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<IncomeTransaction> Transactions { get; set; } = new List<IncomeTransaction>();
    }
}
