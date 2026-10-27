namespace AgriMan.Api.DTOs
{
    public class PhotoUploadRequestDto
    {
        public string? Photo { get; set; }
        public string? ProfilePhoto
        {
            get => Photo;
            set => Photo = value;
        }
    }
}
