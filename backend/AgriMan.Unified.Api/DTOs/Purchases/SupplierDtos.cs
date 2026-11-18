using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateSupplierDto
    {
        [Required]
        public int FarmerId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContactPerson { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(255)]
        public string? Address { get; set; }

        [MaxLength(50)]
        public string? GstNumber { get; set; }
    }

    public class SupplierResponseDto
    {
        public long Id { get; set; }
        public int FarmerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? GstNumber { get; set; }
    }
}