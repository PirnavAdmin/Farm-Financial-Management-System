namespace AgriMan.Api.DTOs
{
    public class UserStatsResponse
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
    }
}
