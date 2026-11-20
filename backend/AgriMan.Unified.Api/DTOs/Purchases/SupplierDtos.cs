using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateSupplierDto
    {
        public int FarmerId { get; set; } = 1;

        public string? Name { get; set; }

        public string? SupplierName { get; set; }

        public string? SupplierCode { get; set; }

        public string? SupplierType { get; set; } = "General";

        public string? Mobile { get; set; }

        public string? ContactPerson { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? District { get; set; }

        public string? State { get; set; } = "Andhra Pradesh";

        public string? PinCode { get; set; }

        public string? GstNumber { get; set; }

        public string? Gstin { get; set; }

        public string? BankName { get; set; }

        public string? AccountNumber { get; set; }

        public string? IfscCode { get; set; }

        public string? BranchName { get; set; }

        public decimal OpeningBalance { get; set; } = 0.00m;

        public string Status { get; set; } = "Active";

        public string? Notes { get; set; }
    }

    public class SupplierResponseDto
    {
        public long Id { get; set; }
        public int FarmerId { get; set; }
        public string SupplierCode { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SupplierType { get; set; } = "General";
        public string Mobile { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Gstin { get; set; }
        public string? GstNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BranchName { get; set; }
        public decimal OpeningBalance { get; set; }
        public string Status { get; set; } = "Active";
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SupplierSummaryDto
    {
        public int TotalSuppliers { get; set; }
        public int ActiveSuppliers { get; set; }
        public int InactiveSuppliers { get; set; }
        public decimal TotalOpeningBalance { get; set; }
        public decimal TotalPurchases { get; set; }
        public decimal TotalPayments { get; set; }
        public decimal TotalOutstandingPayables { get; set; }
    }

    public class SupplierLedgerItemDto
    {
        public DateTime Date { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? ReferenceNo { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal Balance { get; set; }
        public string? PaymentMode { get; set; }
    }

    public class SupplierLedgerResponseDto
    {
        public long SupplierId { get; set; }
        public string SupplierCode { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public decimal OpeningBalance { get; set; }
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public decimal NetOutstandingBalance { get; set; }
        public List<SupplierLedgerItemDto> Ledger { get; set; } = new();
    }
}
