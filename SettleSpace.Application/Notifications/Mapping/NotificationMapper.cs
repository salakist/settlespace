using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Application.Notifications.Mapping;

public class NotificationMapper : INotificationMapper
{
    public NotificationDto ToDto(Notification entity) =>
        new()
        {
            Id = entity.Id,
            Type = entity.Type,
            TransactionId = entity.TransactionId,
            IsRead = entity.IsRead,
            CreatedAtUtc = entity.CreatedAtUtc,
        };
}
