using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Application.Notifications.Services;

public interface INotificationApplicationService
{
    Task CreateAsync(string recipientPersonId, NotificationType type, string? transactionId = null);
    Task<List<NotificationDto>> GetMyUnreadAsync(string loggedPersonId);
    Task MarkReadAsync(string id, string loggedPersonId);
    Task MarkAllMyReadAsync(string loggedPersonId);
}
