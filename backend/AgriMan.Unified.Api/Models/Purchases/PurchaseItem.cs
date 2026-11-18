namespace FarmManagementApi.Models
{
    public class PurchaseItem
    {
        public long Id { get; set; }
        public long PurchaseId { get; set; }
        public Purchase Purchase { get; set; } = null!;

        public string ProductName { get; set; } = string.Empty; // e.g., Fertilizer, Seeds, Pesticide
        public string? Unit { get; set; } // e.g., Bags, Liters, Kg

        public decimal Quantity { get; set; }
        public decimal Rate { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal TaxRate { get; set; } = 0; // Tax % or Amount
        public decimal Total { get; set; } // (Qty * Rate) - Discount + Tax
    }
}