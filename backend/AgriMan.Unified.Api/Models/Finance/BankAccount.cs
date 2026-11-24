namespace FarmManagementApi.Models
{
    public class BankAccount
    {
        public int Id { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string Ifsc { get; set; } = string.Empty;
        public string Branch { get; set; } = string.Empty;
        public string AccountType { get; set; } = "Current"; // Current, Savings, Cash
        public decimal OpeningBalance { get; set; } = 0;
        public decimal CurrentBalance { get; set; } = 0;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
