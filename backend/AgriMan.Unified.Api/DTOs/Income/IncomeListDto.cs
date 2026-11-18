namespace FarmManagementApi.DTOs
{
    public class IncomeListDto
    {
        public long Id { get; set; }
        public DateTime Date { get; set; }
        public string IncomeNo { get; set; } = string.Empty;
        public string Farmer { get; set; } = string.Empty;
        public string Farm { get; set; } = string.Empty;
        public string? Crop { get; set; }
        public string IncomeType { get; set; } = string.Empty;
        public string Buyer { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}