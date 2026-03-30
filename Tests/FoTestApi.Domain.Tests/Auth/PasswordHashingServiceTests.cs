using FoTestApi.Domain.Auth;

namespace FoTestApi.Domain.Tests.Auth;

public class PasswordHashingServiceTests
{
    private readonly PasswordHashingService _sut = new();

    [Fact]
    public void HashPasswordReturnsHashInsteadOfPlaintext()
    {
        var password = "Strong@Pass1";

        var result = _sut.HashPassword(password);

        Assert.NotEqual(password, result);
        Assert.True(_sut.IsPasswordHash(result));
    }

    [Fact]
    public void VerifyPasswordWithMatchingPasswordReturnsTrue()
    {
        var passwordHash = _sut.HashPassword("Strong@Pass1");

        var result = _sut.VerifyPassword("Strong@Pass1", passwordHash);

        Assert.True(result);
    }

    [Fact]
    public void VerifyPasswordWithNonMatchingPasswordReturnsFalse()
    {
        var passwordHash = _sut.HashPassword("Strong@Pass1");

        var result = _sut.VerifyPassword("Wrong@Pass1", passwordHash);

        Assert.False(result);
    }
}

