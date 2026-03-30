using FoTestApi.Domain.Auth;
using System.Text.RegularExpressions;
using Xunit;

namespace FoTestApi.Domain.Tests.Auth;

public class PasswordGeneratorTests
{
    private readonly PasswordGenerator _sut = new();

    [Fact]
    public void GeneratePasswordReturnsValidPassword()
    {
        var password = _sut.GeneratePassword();

        Assert.NotEmpty(password);
        Assert.True(password.Length >= 8, "Password must be at least 8 characters");
    }

    [Fact]
    public void GeneratePasswordContainsUppercase()
    {
        var password = _sut.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[A-Z]"), "Password must contain at least one uppercase letter");
    }

    [Fact]
    public void GeneratePasswordContainsLowercase()
    {
        var password = _sut.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[a-z]"), "Password must contain at least one lowercase letter");
    }

    [Fact]
    public void GeneratePasswordContainsDigit()
    {
        var password = _sut.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[0-9]"), "Password must contain at least one digit");
    }

    [Fact]
    public void GeneratePasswordContainsSpecialCharacter()
    {
        var password = _sut.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?]"), 
                    "Password must contain at least one special character");
    }

    [Fact]
    public void GeneratePasswordGeneratesRandomPasswords()
    {
        var password1 = _sut.GeneratePassword();
        var password2 = _sut.GeneratePassword();

        // It's extremely unlikely (but technically possible) that two random passwords are identical
        // This test verifies the randomness with high confidence
        Assert.NotEqual(password1, password2);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public void GeneratePasswordMultipleGenerationsAllValid(int count)
    {
        var passwordValidator = new PasswordValidator();

        for (int i = 0; i < count; i++)
        {
            var password = _sut.GeneratePassword();

            // Should not throw WeakPasswordException
            passwordValidator.Validate(password);
        }
    }
}


