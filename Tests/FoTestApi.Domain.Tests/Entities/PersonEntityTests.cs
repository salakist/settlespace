using FoTestApi.Domain.Entities;

namespace FoTestApi.Domain.Tests.Entities;

public class PersonEntityTests
{
    [Fact]
    public void ValidateValidPersonDoesNotThrow()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Theory]
    [InlineData("", "Doe")]
    [InlineData("   ", "Doe")]
    public void ValidateEmptyOrWhitespaceFirstNameThrowsInvalidOperationException(string firstName, string lastName)
    {
        var person = new PersonEntity { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Theory]
    [InlineData("John", "")]
    [InlineData("John", "   ")]
    public void ValidateEmptyOrWhitespaceLastNameThrowsInvalidOperationException(string firstName, string lastName)
    {
        var person = new PersonEntity { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Fact]
    public void MatchesByFullNameSameNamesReturnsTrue()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "John", LastName = "Doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentCaseReturnsTrue()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "JOHN", LastName = "doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentFirstNameReturnsFalse()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "Jane", LastName = "Doe" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullNameDifferentLastNameReturnsFalse()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "John", LastName = "Smith" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void PersonWithPasswordCanBeSetAndRetrieved()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "secret123" };

        Assert.Equal("secret123", person.Password);
    }

    [Fact]
    public void PersonPasswordCanBeNull()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = null };

        Assert.Null(person.Password);
    }

    [Fact]
    public void ValidateWithValidOptionalFieldsDoesNotThrow()
    {
        var person = new PersonEntity
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
    public void ValidateWithInvalidEmailThrowsInvalidOperationException(string email)
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Email = email };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Theory]
    [InlineData("12")]
    [InlineData("abc")]
    public void ValidateWithInvalidPhoneNumberThrowsInvalidOperationException(string phoneNumber)
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", PhoneNumber = phoneNumber };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Fact]
    public void ValidateWithFutureDateOfBirthThrowsInvalidOperationException()
    {
        var person = new PersonEntity
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1)
        };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Fact]
    public void ValidateWithInvalidAddressThrowsInvalidOperationException()
    {
        var person = new PersonEntity
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

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

}
