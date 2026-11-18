using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class PurchaseItemDto
    {
        [Required]
        public string ProductName { get; set; } = string.Empty;
        public string? Unit { get; set; }
        [Range(0.001, double.MaxValue)]
        public decimal Quantity { get; set; }
        [Range(0, double.MaxValue)]
        public decimal Rate { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal TaxRate { get; set; } = 0;
    }

    public class CreatePurchaseDto
    {
        [Required]
        public int FarmerId { get; set; }

        [Required]
        public long SupplierId { get; set; }

        public DateTime? PurchaseDate { get; set; }
        public long? FarmId { get; set; }
        public long? CropId { get; set; }
        public string? Notes { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one item is required.")]
        public List<PurchaseItemDto> Items { get; set; } = new();

        // Optional upfront payment details
        public decimal? PaidAmount { get; set; }
        public string? PaymentMode { get; set; } // Cash, UPI, Bank Transfer
        public string? BankOrCash { get; set; }
        public string? ReferenceNumber { get; set; }
    }

    public class AddPurchasePaymentDto
    {
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMode { get; set; } = "Cash";
        public string BankOrCash { get; set; } = "Cash";
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
    }
}