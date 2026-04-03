using SettleSpace.Domain.Auth;

namespace SettleSpace.Domain.Tests.Auth;

public class AuthContextExceptionTests
{
    [Fact]
    public void ConstructorWithoutArgumentsUsesDefaultMessage()
    {
        var exception = new AuthContextException();

        Assert.Equal("Authentication context is missing or invalid.", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageUsesProvidedMessage()
    {
        var exception = new AuthContextException("Custom message");

        Assert.Equal("Custom message", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageAndInnerExceptionPreservesInnerException()
    {
        var innerException = new InvalidOperationException("root cause");

        var exception = new AuthContextException("Custom message", innerException);

        Assert.Equal("Custom message", exception.Message);
        Assert.Same(innerException, exception.InnerException);
    }
}