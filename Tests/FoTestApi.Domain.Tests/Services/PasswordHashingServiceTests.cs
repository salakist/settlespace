using FoTestApi.Domain.Services;

namespace FoTestApi.Domain.Tests.Services;

public class PasswordHashingServiceTests
{
    private readonly PasswordHashingService _sut = new();

    [Fact]
    public void HashPassword_ReturnsHashInsteadOfPlaintext()
    {
        var password = "Strong@Pass1";

        var result = _sut.HashPassword(password);

        Assert.NotEqual(password, result);
        Assert.True(_sut.IsPasswordHash(result));
    }

    [Fact]
    public void VerifyPassword_WithMatchingPassword_ReturnsTrue()
    {
        var passwordHash = _sut.HashPassword("Strong@Pass1");

        var result = _sut.VerifyPassword("Strong@Pass1", passwordHash);

        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_WithNonMatchingPassword_ReturnsFalse()
    {
        var passwordHash = _sut.HashPassword("Strong@Pass1");

        var result = _sut.VerifyPassword("Wrong@Pass1", passwordHash);

        Assert.False(result);
    }
}