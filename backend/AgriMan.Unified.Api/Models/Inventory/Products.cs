using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmManagementApi.Models
{
    [Table("products")]
    public class Products
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public ProductCategory? Category { get; set; }

        public int UnitId { get; set; }

        [ForeignKey("UnitId")]
        public Units? Units { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ReorderLevel { get; set; } // Low stock threshold

        [Column(TypeName = "decimal(18,2)")]
        public decimal StandardCost { get; set; }

        public bool IsActive { get; set; } = true;
    }
}