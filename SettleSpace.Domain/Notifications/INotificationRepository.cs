using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Domain.Notifications;

public interface INotificationRepository
{
    Task<Notification> CreateAsync(Notification notification);
    Task<Notification?> GetByIdAsync(string id);
    Task<List<Notification>> GetUnreadByRecipientAsync(string recipientPersonId);
    Task MarkReadByIdAsync(string id);
    Task MarkAllReadByRecipientAsync(string recipientPersonId);
}
