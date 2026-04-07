using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication.Mapping
{
    public interface IAuthMapper
    {
        LoginResponseDto ToDto(Person person, string token, DateTime expiresAtUtc);
    }
}
