using System.ComponentModel.DataAnnotations;

namespace AgriMan.Api.DTOs
{
    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid mobile number format.")]
        [MaxLength(25, ErrorMessage = "Mobile number cannot exceed 25 characters.")]
        public string? MobileNumber { get; set; }

        public string? Mobile
        {
            get => MobileNumber;
            set => MobileNumber = value;
        }

        public List<string>? Roles { get; set; }

        public bool? IsActive { get; set; }

        public string? ProfilePhoto { get; set; }

        public string? Photo
        {
            get => ProfilePhoto;
            set => ProfilePhoto = value;
        }

        public List<string>? Permissions { get; set; }
    }
}
