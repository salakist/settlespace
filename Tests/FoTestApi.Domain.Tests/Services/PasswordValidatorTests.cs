using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Services;

namespace FoTestApi.Domain.Tests.Services;

public class PasswordValidatorTests
{
    private readonly PasswordValidator _sut = new();

    [Fact]
    public void Validate_WithStrongPassword_DoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate("StrongP@ss1"));

        Assert.Null(ex);
    }

    [Fact]
    public void Validate_PasswordTooShort_ThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("Short1!"));
    }

    [Fact]
    public void Validate_PasswordNoUppercase_ThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("weakpass1!"));
    }

    [Fact]
    public void Validate_PasswordNoLowercase_ThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WEAKPASS1!"));
    }

    [Fact]
    public void Validate_PasswordNoDigit_ThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WeakPass!"));
    }

    [Fact]
    public void Validate_PasswordNoSpecialChar_ThrowsWeakPasswordException()
    {
        Assert.Throws<WeakPasswordException>(() => _sut.Validate("WeakPass1"));
    }

    [Fact]
    public void Validate_NullPassword_DoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate(null));

        Assert.Null(ex);
    }

    [Fact]
    public void Validate_EmptyPassword_DoesNotThrow()
    {
        var ex = Record.Exception(() => _sut.Validate(string.Empty));

        Assert.Null(ex);
    }
}