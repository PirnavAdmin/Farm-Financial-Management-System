using System.ComponentModel.DataAnnotations;

namespace Agriman.Machinery.Api.DTOs;

public class MachineryExpenseDto
{
    public int Id { get; set; }
    public int? MachineryId { get; set; }
    public string MachineName { get; set; } = string.Empty;
    public string ExpenseType { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string? Operator { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMachineryExpenseRequest
{
    public int? MachineryId { get; set; }

    [MaxLength(150)]
    public string? MachineName { get; set; }

    [Required(ErrorMessage = "Expense type is required.")]
    [MaxLength(100)]
    public string ExpenseType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expense date is required.")]
    public DateTime? Date { get; set; }

    [Required(ErrorMessage = "Amount is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal? Amount { get; set; }

    [MaxLength(150)]
    public string? Operator { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateMachineryExpenseRequest : CreateMachineryExpenseRequest
{
}

public class MachineryExpenseListResponse
{
    public int TotalExpenseRecords { get; set; }
    public int RowsShown { get; set; }
    public int ExpenseTypesCount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<MachineryExpenseDto> Items { get; set; } = new();
}
