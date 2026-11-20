using System.ComponentModel.DataAnnotations;

namespace Agriman.Machinery.Api.DTOs;

public class MachineryDto
{
    public int Id { get; set; }
    public string MachineCode => $"MCH-{Id:D3}";
    public string MachineName { get; set; } = string.Empty;
    public string MachineType { get; set; } = string.Empty;
    public string? RegistrationNo { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal PurchaseCost { get; set; }
    public decimal CurrentValue { get; set; }
    public string? FuelType { get; set; }
    public string Status { get; set; } = "Active";
    public string? ModelNumber { get; set; }
    public string? Manufacturer { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ExpenseCount { get; set; }
    public decimal TotalExpenses { get; set; }
}

public class CreateMachineryRequest
{
    [Required(ErrorMessage = "Machine name is required.")]
    [MaxLength(150)]
    public string MachineName { get; set; } = string.Empty;

    public string? MachineCode { get; set; }

    [Required(ErrorMessage = "Machine type is required.")]
    [MaxLength(100)]
    public string MachineType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RegistrationNo { get; set; }

    public DateTime? PurchaseDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Purchase cost cannot be negative.")]
    public decimal? PurchaseCost { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Current value cannot be negative.")]
    public decimal? CurrentValue { get; set; }

    [MaxLength(50)]
    public string? FuelType { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    [MaxLength(100)]
    public string? ModelNumber { get; set; }

    [MaxLength(100)]
    public string? Manufacturer { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateMachineryRequest : CreateMachineryRequest
{
}

public class MachineryListResponse
{
    public int TotalMachines { get; set; }
    public int RowsShown { get; set; }
    public int ExpenseTypesCount { get; set; }
    public List<MachineryDto> Items { get; set; } = new();
    public List<MachineryDto> Data => Items;
}

public class MachinerySummaryDto
{
    public int TotalMachines { get; set; }
    public int ActiveMachines { get; set; }
    public int UnderMaintenanceMachines { get; set; }
    public int InactiveMachines { get; set; }
    public decimal TotalPurchaseCost { get; set; }
    public decimal TotalCurrentValue { get; set; }
    public int TotalExpenseRecords { get; set; }
    public decimal TotalExpenseAmount { get; set; }
    public int ExpenseTypesCount { get; set; }
}

public class MachineryExpenseTypeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class MachineryLookupsDto
{
    public List<string> MachineTypes { get; set; } = new();
    public List<string> FuelTypes { get; set; } = new();
    public List<string> Statuses { get; set; } = new();
    public List<MachineryExpenseTypeDto> ExpenseTypes { get; set; } = new();
}
