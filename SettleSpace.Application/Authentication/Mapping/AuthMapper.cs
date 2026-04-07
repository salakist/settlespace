using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication.Mapping
{
    public class AuthMapper : IAuthMapper
    {
        public LoginResponseDto ToDto(Person person, string token, DateTime expiresAtUtc) =>
            new()
            {
                Token = token,
                Username = person.Username,
                PersonId = person.Id ?? string.Empty,
                DisplayName = person.DisplayName,
                Role = person.Role,
                ExpiresAtUtc = expiresAtUtc,
            };
    }
}
