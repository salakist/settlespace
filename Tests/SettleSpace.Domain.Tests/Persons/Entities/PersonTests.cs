using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Tests.Persons.Entities;

public class PersonTests
{
    [Fact]
    public void ValidateValidPersonDoesNotThrow()
    {
        var person = new Person { FirstName = "John", LastName = "Doe" };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Theory]
    [InlineData("", "Doe")]
    [InlineData("   ", "Doe")]
    public void ValidateEmptyOrWhitespaceFirstNameThrowsInvalidPersonException(string firstName, string lastName)
    {
        var person = new Person { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidPersonException>(() => person.Validate());
    }

    [Theory]
    [InlineData("John", "")]
    [InlineData("John", "   ")]
    public void ValidateEmptyOrWhitespaceLastNameThrowsInvalidPersonException(string firstName, string lastName)
    {
        var person = new Person { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidPersonException>(() => person.Validate());
    }

    [Fact]
    public void MatchesByFullNameSameNamesReturnsTrue()
    {
        var person = new Person { FirstName = "John", LastName = "Doe" };
        var other  = new Person { FirstName = "John", LastName = "Doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentCaseReturnsTrue()
    {
        var person = new Person { FirstName = "John", LastName = "Doe" };
        var other  = new Person { FirstName = "JOHN", LastName = "doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentFirstNameReturnsFalse()
    {
        var person = new Person { FirstName = "John", LastName = "Doe" };
        var other  = new Person { FirstName = "Jane", LastName = "Doe" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentLastNameReturnsFalse()
    {
        var person = new Person { FirstName = "John", LastName = "Doe" };
        var other  = new Person { FirstName = "John", LastName = "Smith" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void PersonWithPasswordCanBeSetAndRetrieved()
    {
        var person = new Person { FirstName = "John", LastName = "Doe", Password = "secret123" };

        Assert.Equal("secret123", person.Password);
    }

    [Fact]
    public void PersonPasswordCanBeNull()
    {
        var person = new Person { FirstName = "John", LastName = "Doe", Password = null };

        Assert.Null(person.Password);
    }

    [Fact]
    public void ValidateWithValidOptionalFieldsDoesNotThrow()
    {
        var person = new Person
        {
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
                    PostalCode = "75001",
                    City = "Paris",
                    Country = "France"
                }
            ]
        };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Theory]
    [InlineData("bad-email")]
    [InlineData("john@")]
    public void ValidateWithInvalidEmailThrowsInvalidPersonException(string email)
    {
        var person = new Person { FirstName = "John", LastName = "Doe", Email = email };

        Assert.Throws<InvalidPersonException>(() => person.Validate());
    }

    [Theory]
    [InlineData("12")]
    [InlineData("abc")]
    public void ValidateWithInvalidPhoneNumberThrowsInvalidPersonException(string phoneNumber)
    {
        var person = new Person { FirstName = "John", LastName = "Doe", PhoneNumber = phoneNumber };

        Assert.Throws<InvalidPersonException>(() => person.Validate());
    }

    [Fact]
    public void ValidateWithFutureDateOfBirthThrowsInvalidPersonException()
    {
        var person = new Person
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1)
        };

        Assert.Throws<InvalidPersonException>(() => person.Validate());
    }

    [Fact]
    public void ValidateWithInvalidAddressThrowsInvalidAddressException()
    {
        var person = new Person
        {
            FirstName = "John",
            LastName = "Doe",
            Addresses =
            [
                new Address
                {
                    Label = "",
                    StreetLine1 = "1 Main Street",
                    PostalCode = "75001",
                    City = "Paris",
                    Country = "France"
                }
            ]
        };

        Assert.Throws<InvalidAddressException>(() => person.Validate());
    }

}



