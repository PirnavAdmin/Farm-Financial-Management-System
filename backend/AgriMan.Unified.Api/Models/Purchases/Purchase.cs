using System;
using System.Collections.Generic;

namespace FarmManagementApi.Models
{
    public class Purchase
    {
        public long Id { get; set; }
        public string PurchaseNo { get; set; } = string.Empty; // e.g., PUR-2026-0001
        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public int FarmerId { get; set; }
        public Farmer Farmer { get; set; } = null!;

        public long SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public long? FarmId { get; set; }
        public long? CropId { get; set; }

        // Financial Summary
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }

        // Status: "Pending", "Partial", "Paid"
        public string PaymentStatus { get; set; } = "Pending";
        public string? Notes { get; set; }

        // Navigation
        public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
        public ICollection<PurchasePayment> Payments { get; set; } = new List<PurchasePayment>();
    }
}