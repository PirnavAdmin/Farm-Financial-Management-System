namespace FarmManagementApi.DTOs
{
    public class IncomeDetailDto
    {
        public long Id { get; set; }
        public string IncomeNo { get; set; } = string.Empty;
        public DateTime IncomeDate { get; set; }
        public int CategoryId { get; set; }
        public string IncomeType { get; set; } = string.Empty;
        public int? FarmerId { get; set; }
        public string Farmer { get; set; } = string.Empty;
        public string Farm { get; set; } = string.Empty;
        public string? Crop { get; set; }
        public string Buyer { get; set; } = string.Empty;

        // Item details
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal NetAmount { get; set; }

        // Payment details
        public string PaymentMode { get; set; } = string.Empty;
        public string? BankOrCash { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }
}