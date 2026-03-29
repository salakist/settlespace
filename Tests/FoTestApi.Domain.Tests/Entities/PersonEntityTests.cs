using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;

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
    public void Validate_WithStrongPassword_DoesNotThrow()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "StrongP@ss1" };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Fact]
    public void Validate_PasswordTooShort_ThrowsWeakPasswordException()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "Short1!" };

        Assert.Throws<WeakPasswordException>(() => person.Validate());
    }

    [Fact]
    public void Validate_PasswordNoUppercase_ThrowsWeakPasswordException()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "weakpass1!" };

        Assert.Throws<WeakPasswordException>(() => person.Validate());
    }

    [Fact]
    public void Validate_PasswordNoLowercase_ThrowsWeakPasswordException()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "WEAKPASS1!" };

        Assert.Throws<WeakPasswordException>(() => person.Validate());
    }

    [Fact]
    public void Validate_PasswordNoDigit_ThrowsWeakPasswordException()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "WeakPass!" };

        Assert.Throws<WeakPasswordException>(() => person.Validate());
    }

    [Fact]
    public void Validate_PasswordNoSpecialChar_ThrowsWeakPasswordException()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = "WeakPass1" };

        Assert.Throws<WeakPasswordException>(() => person.Validate());
    }

    [Fact]
    public void Validate_NullPasswordIsValid()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = null };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }

    [Fact]
    public void Validate_EmptyPasswordIsValid()
    {
        var person = new PersonEntity { FirstName = "John", LastName = "Doe", Password = string.Empty };

        var ex = Record.Exception(() => person.Validate());

        Assert.Null(ex);
    }
}
