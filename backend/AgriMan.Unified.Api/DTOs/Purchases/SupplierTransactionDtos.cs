using System;
using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateSupplierTransactionDto
    {
        public string? TransactionCode { get; set; }

        public DateTime? TransactionDate { get; set; }

        [Required]
        public long SupplierId { get; set; }

        public string? SupplierName { get; set; }

        public string TransactionType { get; set; } = "Purchase";

        public string? ReferenceNo { get; set; }

        public string? Category { get; set; }

        public string? ItemsSummary { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public decimal PaidAmount { get; set; } = 0.00m;

        public decimal BalanceAmount { get; set; } = 0.00m;

        public string PaymentStatus { get; set; } = "Pending";

        public string? Notes { get; set; }
    }

    public class SupplierTransactionResponseDto
    {
        public long Id { get; set; }
        public string TransactionCode { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public long SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string TransactionType { get; set; } = "Purchase";
        public string? ReferenceNo { get; set; }
        public string? Category { get; set; }
        public string? ItemsSummary { get; set; }
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
