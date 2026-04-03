using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Tests.Persons.Entities;

public class AddressTests
{
    [Fact]
    public void ValidateWithValidAddressDoesNotThrow()
    {
        var address = BuildValidAddress();

        var exception = Record.Exception(address.Validate);

        Assert.Null(exception);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateWithEmptyLabelThrowsInvalidAddressException(string label)
    {
        var address = BuildValidAddress();
        address.Label = label;

        Assert.Throws<InvalidAddressException>(address.Validate);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateWithEmptyStreetLine1ThrowsInvalidAddressException(string streetLine1)
    {
        var address = BuildValidAddress();
        address.StreetLine1 = streetLine1;

        Assert.Throws<InvalidAddressException>(address.Validate);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("?")]
    [InlineData("12")]
    public void ValidateWithInvalidPostalCodeThrowsInvalidAddressException(string? postalCode)
    {
        var address = BuildValidAddress();
        address.PostalCode = postalCode!;

        Assert.Throws<InvalidAddressException>(address.Validate);
    }

    [Theory]
    [InlineData("75001")]
    [InlineData("SW1A 1AA")]
    [InlineData(" 75001 ")]
    public void ValidateWithValidPostalCodeDoesNotThrow(string postalCode)
    {
        var address = BuildValidAddress();
        address.PostalCode = postalCode;

        var exception = Record.Exception(address.Validate);

        Assert.Null(exception);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateWithEmptyCityThrowsInvalidAddressException(string city)
    {
        var address = BuildValidAddress();
        address.City = city;

        Assert.Throws<InvalidAddressException>(address.Validate);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateWithEmptyCountryThrowsInvalidAddressException(string country)
    {
        var address = BuildValidAddress();
        address.Country = country;

        Assert.Throws<InvalidAddressException>(address.Validate);
    }

    private static Address BuildValidAddress() =>
        new()
        {
            Label = "Home",
            StreetLine1 = "1 Main Street",
            StreetLine2 = "Apartment 4",
            PostalCode = "75001",
            City = "Paris",
            StateOrRegion = "Ile-de-France",
            Country = "France"
        };
}

