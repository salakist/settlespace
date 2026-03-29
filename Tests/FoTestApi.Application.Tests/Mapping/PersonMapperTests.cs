using FoTestApi.Application.Commands;
using FoTestApi.Application.Mapping;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Tests.Mapping;

public class PersonMapperTests
{
    private readonly PersonMapper _sut = new();

    [Fact]
    public void ToDtoMapsAllScalarAndAddressFields()
    {
        var entity = new PersonEntity
        {
            Id = "person-1",
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "+33 6 12 34 56 78",
            Email = "john.doe@example.com",
            DateOfBirth = new DateOnly(1990, 5, 2),
            Addresses =
            [
                new Address
                {
                    Label = "Home",
                    StreetLine1 = "1 Main Street",
                    StreetLine2 = "Apartment 4",
                    PostalCode = "75001",
                    City = "Paris",
                    StateOrRegion = "Ile-de-France",
                    Country = "France"
                }
            ]
        };

        var result = _sut.ToDto(entity);

        Assert.Equal(entity.Id, result.Id);
        Assert.Equal(entity.FirstName, result.FirstName);
        Assert.Equal(entity.LastName, result.LastName);
        Assert.Equal(entity.PhoneNumber, result.PhoneNumber);
        Assert.Equal(entity.Email, result.Email);
        Assert.Equal(entity.DateOfBirth, result.DateOfBirth);
        Assert.Single(result.Addresses);
        Assert.Equal("Home", result.Addresses[0].Label);
        Assert.Equal("1 Main Street", result.Addresses[0].StreetLine1);
        Assert.Equal("Apartment 4", result.Addresses[0].StreetLine2);
        Assert.Equal("75001", result.Addresses[0].PostalCode);
        Assert.Equal("Paris", result.Addresses[0].City);
        Assert.Equal("Ile-de-France", result.Addresses[0].StateOrRegion);
        Assert.Equal("France", result.Addresses[0].Country);
    }

    [Fact]
    public void ToEntityForCreateMapsAllFieldsAndUsesProvidedPassword()
    {
        var command = new CreatePersonCommand
        {
            FirstName = "Jane",
            LastName = "Doe",
            PhoneNumber = "+1 555 123 4567",
            Email = "jane.doe@example.com",
            DateOfBirth = new DateOnly(1992, 7, 10),
            Addresses =
            [
                new AddressCommand
                {
                    Label = "Office",
                    StreetLine1 = "100 Business Road",
                    StreetLine2 = null,
                    PostalCode = "10001",
                    City = "New York",
                    StateOrRegion = "NY",
                    Country = "USA"
                }
            ]
        };

        var result = _sut.ToEntity(command, "hashed::secret");

        Assert.Null(result.Id);
        Assert.Equal(command.FirstName, result.FirstName);
        Assert.Equal(command.LastName, result.LastName);
        Assert.Equal(command.PhoneNumber, result.PhoneNumber);
        Assert.Equal(command.Email, result.Email);
        Assert.Equal(command.DateOfBirth, result.DateOfBirth);
        Assert.Equal("hashed::secret", result.Password);
        Assert.Single(result.Addresses);
        Assert.Equal("Office", result.Addresses[0].Label);
        Assert.Equal("100 Business Road", result.Addresses[0].StreetLine1);
        Assert.Null(result.Addresses[0].StreetLine2);
        Assert.Equal("10001", result.Addresses[0].PostalCode);
        Assert.Equal("New York", result.Addresses[0].City);
        Assert.Equal("NY", result.Addresses[0].StateOrRegion);
        Assert.Equal("USA", result.Addresses[0].Country);
    }

    [Fact]
    public void ToEntityForUpdateMapsAllFieldsAndPreservesIdAndPassword()
    {
        var command = new UpdatePersonCommand
        {
            FirstName = "Janet",
            LastName = "Smith",
            PhoneNumber = "+44 20 7946 0958",
            Email = "janet.smith@example.com",
            DateOfBirth = new DateOnly(1988, 3, 14),
            Addresses =
            [
                new AddressCommand
                {
                    Label = "Billing",
                    StreetLine1 = "50 High Street",
                    StreetLine2 = "Suite 5",
                    PostalCode = "SW1A 1AA",
                    City = "London",
                    StateOrRegion = null,
                    Country = "UK"
                }
            ]
        };

        var result = _sut.ToEntity("person-99", command, "hashed::existing");

        Assert.Equal("person-99", result.Id);
        Assert.Equal(command.FirstName, result.FirstName);
        Assert.Equal(command.LastName, result.LastName);
        Assert.Equal(command.PhoneNumber, result.PhoneNumber);
        Assert.Equal(command.Email, result.Email);
        Assert.Equal(command.DateOfBirth, result.DateOfBirth);
        Assert.Equal("hashed::existing", result.Password);
        Assert.Single(result.Addresses);
        Assert.Equal("Billing", result.Addresses[0].Label);
        Assert.Equal("50 High Street", result.Addresses[0].StreetLine1);
        Assert.Equal("Suite 5", result.Addresses[0].StreetLine2);
        Assert.Equal("SW1A 1AA", result.Addresses[0].PostalCode);
        Assert.Equal("London", result.Addresses[0].City);
        Assert.Null(result.Addresses[0].StateOrRegion);
        Assert.Equal("UK", result.Addresses[0].Country);
    }
}