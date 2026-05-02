using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Notifications.Exceptions;

public class UnauthorizedNotificationAccessException : ForbiddenException
{
    public UnauthorizedNotificationAccessException()
        : base("You do not have permission to access this notification.")
    {
    }

    public UnauthorizedNotificationAccessException(string message)
        : base(message)
    {
    }

    public UnauthorizedNotificationAccessException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
