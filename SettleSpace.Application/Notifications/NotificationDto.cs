using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Application.Notifications;

public class NotificationDto
{
    public string? Id { get; set; }
    public NotificationType Type { get; set; }
    public string? TransactionId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
