using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Application.Authentication
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public PersonRole Role { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }
}

