using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Persons.Commands;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication.Mapping
{
    public interface IAuthMapper
    {
        LoginResponseDto ToLoginResponseDto(Person person, string token, DateTime expiresAtUtc);
        CreatePersonCommand ToCreatePersonCommand(RegisterCommand command);
        LoginCommand ToLoginCommand(string username, string password);
    }
}
