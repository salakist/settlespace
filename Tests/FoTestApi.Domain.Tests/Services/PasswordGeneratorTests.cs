using FoTestApi.Domain.Services;
using System.Text.RegularExpressions;
using Xunit;

namespace FoTestApi.Domain.Tests.Services;

public class PasswordGeneratorTests
{
    [Fact]
    public void GeneratePassword_ReturnsValidPassword()
    {
        var password = PasswordGenerator.GeneratePassword();

        Assert.NotEmpty(password);
        Assert.True(password.Length >= 8, "Password must be at least 8 characters");
    }

    [Fact]
    public void GeneratePassword_ContainsUppercase()
    {
        var password = PasswordGenerator.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[A-Z]"), "Password must contain at least one uppercase letter");
    }

    [Fact]
    public void GeneratePassword_ContainsLowercase()
    {
        var password = PasswordGenerator.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[a-z]"), "Password must contain at least one lowercase letter");
    }

    [Fact]
    public void GeneratePassword_ContainsDigit()
    {
        var password = PasswordGenerator.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[0-9]"), "Password must contain at least one digit");
    }

    [Fact]
    public void GeneratePassword_ContainsSpecialCharacter()
    {
        var password = PasswordGenerator.GeneratePassword();

        Assert.True(Regex.IsMatch(password, "[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?]"), 
                    "Password must contain at least one special character");
    }

    [Fact]
    public void GeneratePassword_GeneratesRandomPasswords()
    {
        var password1 = PasswordGenerator.GeneratePassword();
        var password2 = PasswordGenerator.GeneratePassword();

        // It's extremely unlikely (but technically possible) that two random passwords are identical
        // This test verifies the randomness with high confidence
        Assert.NotEqual(password1, password2);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public void GeneratePassword_MultipleGenerations_AllValid(int count)
    {
        var passwordValidator = new PasswordValidator();

        for (int i = 0; i < count; i++)
        {
            var password = PasswordGenerator.GeneratePassword();

            // Should not throw WeakPasswordException
            passwordValidator.Validate(password);
        }
    }
}
