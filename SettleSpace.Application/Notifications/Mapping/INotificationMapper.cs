using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Application.Notifications.Mapping;

public interface INotificationMapper
{
    NotificationDto ToDto(Notification entity);
}
