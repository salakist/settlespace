namespace FoTestApi.Application.Authentication
{
    public class AuthSettings
    {
        public const string SectionName = "Auth";

        public string JwtKey { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int TokenExpirationMinutes { get; set; } = 60;
    }
}
