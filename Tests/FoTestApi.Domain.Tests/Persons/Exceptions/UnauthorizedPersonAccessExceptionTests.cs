using FoTestApi.Domain.Persons.Exceptions;

namespace FoTestApi.Domain.Tests.Persons.Exceptions;

public class UnauthorizedPersonAccessExceptionTests
{
    [Fact]
    public void ConstructorWithoutArgumentsUsesBaseExceptionMessage()
    {
        var exception = new UnauthorizedPersonAccessException();

        Assert.Equal("Exception of type 'FoTestApi.Domain.Persons.Exceptions.UnauthorizedPersonAccessException' was thrown.", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageUsesProvidedMessage()
    {
        var exception = new UnauthorizedPersonAccessException("Forbidden");

        Assert.Equal("Forbidden", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageAndInnerExceptionPreservesInnerException()
    {
        var innerException = new InvalidOperationException("root cause");

        var exception = new UnauthorizedPersonAccessException("Forbidden", innerException);

        Assert.Equal("Forbidden", exception.Message);
        Assert.Same(innerException, exception.InnerException);
    }
}