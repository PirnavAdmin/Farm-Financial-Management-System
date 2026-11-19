using System;
using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateSupplierPaymentDto
    {
        public string? PaymentCode { get; set; }

        public DateTime? PaymentDate { get; set; }

        [Required]
        public long SupplierId { get; set; }

        public string? SupplierName { get; set; }

        [Required]
        public decimal AmountPaid { get; set; }

        public string PaymentMode { get; set; } = "Bank Transfer";

        public string? ReferenceNo { get; set; }

        public string? BankAccount { get; set; }

        public string? Notes { get; set; }
    }

    public class SupplierPaymentResponseDto
    {
        public long Id { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public long SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string PaymentMode { get; set; } = "Bank Transfer";
        public string? ReferenceNo { get; set; }
        public string? BankAccount { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
