using SettleSpace.Domain.Notifications.Exceptions;

namespace SettleSpace.Domain.Tests.Notifications.Exceptions;

public class NotificationNotFoundExceptionTests
{
    [Fact]
    public void ConstructorWithoutArgumentsUsesBaseExceptionMessage()
    {
        var exception = new NotificationNotFoundException();

        Assert.Equal("Exception of type 'SettleSpace.Domain.Notifications.Exceptions.NotificationNotFoundException' was thrown.", exception.Message);
    }

    [Fact]
    public void ConstructorWithIdUsesFormattedMessage()
    {
        var exception = new NotificationNotFoundException("abc123");

        Assert.Equal("Notification with ID 'abc123' not found.", exception.Message);
    }

    [Fact]
    public void ConstructorWithMessageAndInnerExceptionPreservesInnerException()
    {
        var innerException = new InvalidOperationException("root cause");

        var exception = new NotificationNotFoundException("Not found", innerException);

        Assert.Equal("Not found", exception.Message);
        Assert.Same(innerException, exception.InnerException);
    }
}
