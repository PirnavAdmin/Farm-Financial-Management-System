namespace FarmManagementApi.Models
{
    public class IncomeTransactionItem
    {
        public long Id { get; set; }
        public long TransactionId { get; set; }
        public IncomeTransaction? Transaction { get; set; }

        public string? ItemName { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal TotalAmount { get; set; }
    }
}