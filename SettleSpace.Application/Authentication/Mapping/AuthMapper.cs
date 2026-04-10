using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Persons.Commands;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication.Mapping;

public class AuthMapper : IAuthMapper
{
    public LoginResponseDto ToLoginResponseDto(Person person, string token, DateTime expiresAtUtc)
    {
        return new LoginResponseDto
        {
            Token = token,
            Username = person.Username,
            PersonId = person.Id ?? string.Empty,
            DisplayName = person.DisplayName,
            Role = person.Role,
            ExpiresAtUtc = expiresAtUtc
        };
    }

    public CreatePersonCommand ToCreatePersonCommand(RegisterCommand command)
    {
        return new CreatePersonCommand
        {
            FirstName = command.FirstName,
            LastName = command.LastName,
            Password = command.Password,
            PhoneNumber = command.PhoneNumber,
            Email = command.Email,
            DateOfBirth = command.DateOfBirth,
            Addresses = command.Addresses
        };
    }

    public LoginCommand ToLoginCommand(string username, string password)
    {
        return new LoginCommand
        {
            Username = username,
            Password = password
        };
    }
}
