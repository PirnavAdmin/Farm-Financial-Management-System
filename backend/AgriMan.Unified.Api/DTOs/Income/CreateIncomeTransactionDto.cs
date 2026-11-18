namespace FarmManagementApi.DTOs
{
    public class CreateIncomeTransactionDto
    {
        public DateTime IncomeDate { get; set; }
        public int CategoryId { get; set; }
        public int? FarmerId { get; set; }
        public string Farm { get; set; } = string.Empty;
        public string? Crop { get; set; }
        public string Buyer { get; set; } = string.Empty;

        // Line Item Details
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal Discount { get; set; }
        public decimal OtherCharges { get; set; }

        // Payment Details
        public string PaymentMode { get; set; } = string.Empty;
        public string? BankOrCash { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Completed";
    }
}