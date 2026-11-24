namespace FarmManagementApi.Models
{
    public class FinancePayment
    {
        public int Id { get; set; }
        public string PaymentNo { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Party { get; set; } = string.Empty;
        public string PaymentType { get; set; } = "Supplier payment"; // Supplier payment, Labour payment, Expense payment, Loan EMI, Other
        public string? ReferenceTransaction { get; set; }
        public decimal Amount { get; set; } = 0;
        public string PaymentMode { get; set; } = "Bank"; // Bank, Cash, UPI, Cheque
        public string BankAccount { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class FinanceReceipt
    {
        public int Id { get; set; }
        public string ReceiptNo { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string From { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public decimal Amount { get; set; } = 0;
        public string PaymentMode { get; set; } = "Bank"; // Bank, Cash, UPI, Cheque
        public string BankAccount { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
