using System.ComponentModel.DataAnnotations;

namespace FarmManagementApi.DTOs
{
    public class CreateFarmerAddressDto
    {
        [Required(ErrorMessage = "Farmer ID is required")]
        public int FarmerId { get; set; }

        [StringLength(250, ErrorMessage = "Address cannot exceed 250 characters")]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Village is required")]
        [StringLength(100, ErrorMessage = "Village cannot exceed 100 characters")]
        public string Village { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mandal is required")]
        [StringLength(100, ErrorMessage = "Mandal cannot exceed 100 characters")]
        public string Mandal { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required")]
        [StringLength(100, ErrorMessage = "District cannot exceed 100 characters")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required")]
        [StringLength(100, ErrorMessage = "State cannot exceed 100 characters")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "PIN Code is required")]
        [StringLength(10, ErrorMessage = "PIN Code cannot exceed 10 characters")]
        public string PinCode { get; set; } = string.Empty;
    }
}
