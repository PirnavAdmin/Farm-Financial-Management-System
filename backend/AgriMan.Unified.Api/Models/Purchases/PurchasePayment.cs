using System;

namespace FarmManagementApi.Models
{
    public class PurchasePayment
    {
        public long Id { get; set; }
        public long PurchaseId { get; set; }
        public Purchase Purchase { get; set; } = null!;

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }

        public string PaymentMode { get; set; } = "Cash"; // Cash, UPI, Bank Transfer, Cheque
        public string BankOrCash { get; set; } = "Cash";
        public string? ReferenceNumber { get; set; } // Transaction / Cheque / UTR No
        public string? Notes { get; set; }
    }
}