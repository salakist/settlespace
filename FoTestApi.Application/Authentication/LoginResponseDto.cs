namespace FoTestApi.Application.Authentication
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
    }
}

