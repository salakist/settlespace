using SettleSpace.Domain.Notifications.Entities;

namespace SettleSpace.Domain.Tests.Notifications.Entities;

public class NotificationTests
{
    [Fact]
    public void DefaultIsReadIsFalse()
    {
        var notification = new Notification
        {
            RecipientPersonId = "person-1",
            Type = NotificationType.TransactionPendingConfirmation,
            TransactionId = "tx-1",
        };

        Assert.False(notification.IsRead);
    }

    [Fact]
    public void DefaultCreatedAtUtcIsRecent()
    {
        var before = DateTime.UtcNow;
        var notification = new Notification
        {
            RecipientPersonId = "person-1",
            Type = NotificationType.TransactionPendingConfirmation,
        };
        var after = DateTime.UtcNow;

        Assert.InRange(notification.CreatedAtUtc, before, after);
    }

    [Fact]
    public void TransactionIdIsOptional()
    {
        var notification = new Notification
        {
            RecipientPersonId = "person-1",
            Type = NotificationType.TransactionPendingConfirmation,
        };

        Assert.Null(notification.TransactionId);
    }

    [Fact]
    public void IdIsNullByDefault()
    {
        var notification = new Notification
        {
            RecipientPersonId = "person-1",
            Type = NotificationType.TransactionPendingConfirmation,
        };

        Assert.Null(notification.Id);
    }
}
