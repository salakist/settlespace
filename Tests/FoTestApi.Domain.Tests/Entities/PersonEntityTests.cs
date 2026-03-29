using FoTestApi.Domain.Entities;

namespace FoTestApi.Domain.Tests.Entities;

public class PersonEntityTests
{
    [Fact]
    public void Validate_ValidPerson_DoesNotThrow()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Theory]
    [InlineData("", "Doe")]
    [InlineData("   ", "Doe")]
    public void Validate_EmptyOrWhitespaceFirstName_ThrowsInvalidOperationException(string firstName, string lastName)
    {
        var person = new PersonEntity { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Theory]
    [InlineData("John", "")]
    [InlineData("John", "   ")]
    public void Validate_EmptyOrWhitespaceLastName_ThrowsInvalidOperationException(string firstName, string lastName)
    {
        var person = new PersonEntity { FirstName = firstName, LastName = lastName };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Fact]
    public void MatchesByFullName_SameNames_ReturnsTrue()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "John", LastName = "Doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullName_DifferentCase_ReturnsTrue()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "JOHN", LastName = "doe" };

        Assert.True(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullName_DifferentFirstName_ReturnsFalse()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "Jane", LastName = "Doe" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void MatchesByFullName_DifferentLastName_ReturnsFalse()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe" };
        var other  = new PersonEntity { FirstName = "John", LastName = "Smith" };

        Assert.False(person.MatchesByFullName(other));
    }

    [Fact]
    public void Person_WithPassword_CanBeSetAndRetrieved()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "secret123" };

        Assert.Equal("secret123", person.Password);
    }

    [Fact]
    public void Person_PasswordCanBeNull()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = null };

        Assert.Null(person.Password);
    }

    [Fact]
    public void Validate_WithValidOptionalFields_DoesNotThrow()
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
    public void Validate_WithInvalidEmail_ThrowsInvalidOperationException(string email)
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Email = email };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Theory]
    [InlineData("12")]
    [InlineData("abc")]
    public void Validate_WithInvalidPhoneNumber_ThrowsInvalidOperationException(string phoneNumber)
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", PhoneNumber = phoneNumber };

        Assert.Throws<InvalidOperationException>(() => person.Validate());
    }

    [Fact]
    public void Validate_WithFutureDateOfBirth_ThrowsInvalidOperationException()
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
    public void Validate_WithInvalidAddress_ThrowsInvalidOperationException()
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
