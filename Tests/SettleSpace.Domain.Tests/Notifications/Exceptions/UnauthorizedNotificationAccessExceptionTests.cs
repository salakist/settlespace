using SettleSpace.Domain.Notifications.Exceptions;

namespace SettleSpace.Domain.Tests.Notifications.Exceptions;

public class UnauthorizedNotificationAccessExceptionTests
{
    [Fact]
    public void ConstructorWithoutArgumentsUsesDefaultMessage()
    {
        var exception = new UnauthorizedNotificationAccessException();

        Assert.Equal("You do not have permission to access this notification.", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageUsesProvidedMessage()
    {
        var exception = new UnauthorizedNotificationAccessException("Forbidden");

        Assert.Equal("Forbidden", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageAndInnerExceptionPreservesInnerException()
    {
        var innerException = new InvalidOperationException("root cause");

        var exception = new UnauthorizedNotificationAccessException("Forbidden", innerException);

        Assert.Equal("Forbidden", exception.Message);
        Assert.Same(innerException, exception.InnerException);
    }
}
