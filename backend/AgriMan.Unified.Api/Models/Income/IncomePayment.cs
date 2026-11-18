namespace FarmManagementApi.Models
{
    public class IncomePayment
    {
        public long Id { get; set; }
        public long TransactionId { get; set; }
        public IncomeTransaction? Transaction { get; set; }

        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = string.Empty;
        public string? BankOrCash { get; set; }
        public string? ReferenceNumber { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    }
}