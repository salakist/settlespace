using SettleSpace.Application.Notifications.Mapping;
using SettleSpace.Domain.Notifications;
using SettleSpace.Domain.Notifications.Entities;
using SettleSpace.Domain.Notifications.Exceptions;

namespace SettleSpace.Application.Notifications.Services;

public class NotificationApplicationService(
    INotificationRepository repository,
    INotificationMapper mapper) : INotificationApplicationService
{
    public async Task CreateAsync(string recipientPersonId, NotificationType type, string? transactionId = null)
    {
        var notification = new Notification
        {
            RecipientPersonId = recipientPersonId,
            Type = type,
            TransactionId = transactionId,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
        };

        await repository.CreateAsync(notification);
    }

    public async Task<List<NotificationDto>> GetMyUnreadAsync(string loggedPersonId)
    {
        var notifications = await repository.GetUnreadByRecipientAsync(loggedPersonId);
        return notifications.ConvertAll(mapper.ToDto);
    }

    public async Task MarkReadAsync(string id, string loggedPersonId)
    {
        var notification = await repository.GetByIdAsync(id)
            ?? throw new NotificationNotFoundException(id);

        if (!string.Equals(notification.RecipientPersonId, loggedPersonId, StringComparison.Ordinal))
        {
            throw new UnauthorizedNotificationAccessException();
        }

        await repository.MarkReadByIdAsync(id);
    }

    public async Task MarkAllMyReadAsync(string loggedPersonId)
    {
        await repository.MarkAllReadByRecipientAsync(loggedPersonId);
    }
}
