using System.ComponentModel.DataAnnotations;

namespace AgriMan.Expenses.Api.DTOs;

/// <summary>
/// DTO for expense category lookup.
/// </summary>
public class ExpenseCategoryDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int ExpenseCount { get; set; }
}

/// <summary>
/// Request to create a new expense category.
/// </summary>
public class ExpenseCategoryCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Request to update an existing expense category.
/// </summary>
public class ExpenseCategoryUpdateRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}
