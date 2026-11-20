using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("suppliers")]
    public class Supplier
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("FarmerId")]
        public int FarmerId { get; set; } = 1;

        public Farmer? Farmer { get; set; }

        [MaxLength(150)]
        [Column("Name")]
        public string? Name { get; set; }

        [MaxLength(100)]
        [Column("ContactPerson")]
        public string? ContactPerson { get; set; }

        [MaxLength(20)]
        [Column("Phone")]
        public string? Phone { get; set; }

        [MaxLength(120)]
        [Column("email")]
        public string? Email { get; set; }

        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("GstNumber")]
        public string? GstNumber { get; set; }

        // Module 15: Extended Supplier Specifications
        [MaxLength(50)]
        [Column("supplier_code")]
        public string SupplierCode { get; set; } = string.Empty;

        [MaxLength(150)]
        [Column("supplier_name")]
        public string SupplierName { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("supplier_type")]
        public string SupplierType { get; set; } = "General";

        [MaxLength(15)]
        [Column("mobile")]
        public string Mobile { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("city")]
        public string? City { get; set; }

        [MaxLength(100)]
        [Column("district")]
        public string? District { get; set; }

        [MaxLength(100)]
        [Column("state")]
        public string? State { get; set; } = "Andhra Pradesh";

        [MaxLength(10)]
        [Column("pin_code")]
        public string? PinCode { get; set; }

        [MaxLength(20)]
        [Column("gstin")]
        public string? Gstin { get; set; }

        [MaxLength(120)]
        [Column("bank_name")]
        public string? BankName { get; set; }

        [MaxLength(50)]
        [Column("account_number")]
        public string? AccountNumber { get; set; }

        [MaxLength(20)]
        [Column("ifsc_code")]
        public string? IfscCode { get; set; }

        [MaxLength(100)]
        [Column("branch_name")]
        public string? BranchName { get; set; }

        [Column("opening_balance", TypeName = "decimal(12,2)")]
        public decimal OpeningBalance { get; set; } = 0.00m;

        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Active";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Collections
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
        public ICollection<SupplierTransaction> Transactions { get; set; } = new List<SupplierTransaction>();
        public ICollection<SupplierPayment> Payments { get; set; } = new List<SupplierPayment>();
    }
}
