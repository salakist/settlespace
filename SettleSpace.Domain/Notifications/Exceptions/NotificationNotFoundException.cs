using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Notifications.Exceptions;

public class NotificationNotFoundException : NotFoundException
{
    public NotificationNotFoundException()
    {
    }

    public NotificationNotFoundException(string id)
        : base($"Notification with ID '{id}' not found.")
    {
    }

    public NotificationNotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
