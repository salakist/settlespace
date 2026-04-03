using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Tests.Auth;

public class PasswordValidatorTests
{
    private readonly PasswordValidator _sut = new();

    [Fact]
    public void ValidateWithStrongPasswordDoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate("StrongP@ss1"));

        Assert.Null(ex);
    }

    [Fact]
    public void ValidatePasswordTooShortThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("Short1!"));
    }

    [Fact]
    public void ValidatePasswordNoUppercaseThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("weakpass1!"));
    }

    [Fact]
    public void ValidatePasswordNoLowercaseThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WEAKPASS1!"));
    }

    [Fact]
    public void ValidatePasswordNoDigitThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WeakPass!"));
    }

    [Fact]
    public void ValidatePasswordNoSpecialCharThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WeakPass1"));
    }

    [Fact]
    public void ValidateNullPasswordDoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate(null));

        Assert.Null(ex);
    }

    [Fact]
    public void ValidateEmptyPasswordDoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate(string.Empty));

        Assert.Null(ex);
    }
}

