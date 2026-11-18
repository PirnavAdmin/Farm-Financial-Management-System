namespace FarmManagementApi.Models
{
    public class IncomeCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<IncomeTransaction> Transactions { get; set; } = new List<IncomeTransaction>();
    }
}
