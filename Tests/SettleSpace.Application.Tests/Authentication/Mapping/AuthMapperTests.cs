using SettleSpace.Application.Authentication.Mapping;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Tests.Authentication.Mapping;

public class AuthMapperTests
{
    private readonly AuthMapper _sut = new();

    [Fact]
    public void ToDtoMapsAllFieldsFromPerson()
    {
        var person = new Person
        {
            Id = "person-1",
            FirstName = "John",
            LastName = "Doe",
            Role = PersonRole.MANAGER,
        };
        var token = "jwt-token-value";
        var expiresAtUtc = DateTime.UtcNow.AddHours(1);

        var dto = _sut.ToDto(person, token, expiresAtUtc);

        Assert.Equal(token, dto.Token);
        Assert.Equal(person.Username, dto.Username);
        Assert.Equal("person-1", dto.PersonId);
        Assert.Equal(person.DisplayName, dto.DisplayName);
        Assert.Equal(PersonRole.MANAGER, dto.Role);
        Assert.Equal(expiresAtUtc, dto.ExpiresAtUtc);
    }

    [Fact]
    public void ToDtoFallsBackToEmptyStringWhenPersonIdIsNull()
    {
        var person = new Person
        {
            Id = null,
            FirstName = "Jane",
            LastName = "Smith",
            Role = PersonRole.USER,
        };

        var dto = _sut.ToDto(person, "token", DateTime.UtcNow);

        Assert.Equal(string.Empty, dto.PersonId);
    }
}
