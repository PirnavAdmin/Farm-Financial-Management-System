namespace FarmManagementApi.Models
{
    public class IncomeTransaction
    {
        public long Id { get; set; }
        public string IncomeNo { get; set; } = string.Empty;
        public DateTime IncomeDate { get; set; }

        public int CategoryId { get; set; }
        public IncomeCategory? Category { get; set; }

        // Foreign key to your existing Farmer model (adjust type if Farmer ID is int/Guid)
        public int? FarmerId { get; set; }
        public Farmer? Farmer { get; set; }

        public string Farm { get; set; } = string.Empty;
        public string? Crop { get; set; }
        public string Buyer { get; set; } = string.Empty;

        public decimal GrossAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal NetAmount { get; set; }

        public string Status { get; set; } = "Completed";
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<IncomeTransactionItem> Items { get; set; } = new List<IncomeTransactionItem>();
        public ICollection<IncomePayment> Payments { get; set; } = new List<IncomePayment>();
    }
}