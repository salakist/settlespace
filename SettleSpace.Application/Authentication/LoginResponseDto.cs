using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PersonId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public PersonRole Role { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
