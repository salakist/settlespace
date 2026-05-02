namespace SettleSpace.Domain.Notifications.Entities;

public class Notification
{
    public string? Id { get; set; }
    public string RecipientPersonId { get; set; } = null!;
    public NotificationType Type { get; set; }
    public string? TransactionId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
