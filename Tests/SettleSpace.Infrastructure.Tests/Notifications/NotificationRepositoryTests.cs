using SettleSpace.Domain.Notifications.Entities;
using SettleSpace.Infrastructure.Notifications;
using Moq;
using MongoDB.Driver;

namespace SettleSpace.Infrastructure.Tests.Notifications;

public class NotificationRepositoryTests
{
    private static IAsyncCursor<Notification> BuildCursor(IEnumerable<Notification> items)
    {
        var list = items.ToList();
        var cursor = new Mock<IAsyncCursor<Notification>>();

        if (list.Count > 0)
        {
            cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true)
                .ReturnsAsync(false);
            cursor.Setup(c => c.Current).Returns(list);
        }
        else
        {
            cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
        }

        return cursor.Object;
    }

    private static Mock<IMongoCollection<Notification>> BuildCollectionMock(IEnumerable<Notification> findResults)
    {
        var mock = new Mock<IMongoCollection<Notification>>();
        mock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Notification>>(),
                It.IsAny<FindOptions<Notification, Notification>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCursor(findResults));
        return mock;
    }

    [Fact]
    public async Task CreateAsyncInsertsNotificationAndReturnsIt()
    {
        var notification = BuildNotification(null);
        var mock = new Mock<IMongoCollection<Notification>>();
        mock.Setup(c => c.InsertOneAsync(
                notification,
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var repo = new NotificationRepository(mock.Object);
        var result = await repo.CreateAsync(notification);

        Assert.Same(notification, result);
    }

    [Fact]
    public async Task GetByIdAsyncReturnsNotificationWhenFound()
    {
        var notification = BuildNotification("n-1");
        var repo = new NotificationRepository(BuildCollectionMock([notification]).Object);

        var result = await repo.GetByIdAsync("n-1");

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetByIdAsyncReturnsNullWhenNotFound()
    {
        var repo = new NotificationRepository(BuildCollectionMock([]).Object);

        var result = await repo.GetByIdAsync("n-999");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetUnreadByRecipientAsyncReturnsNotifications()
    {
        var notifications = new[] { BuildNotification("n-1"), BuildNotification("n-2") };
        var repo = new NotificationRepository(BuildCollectionMock(notifications).Object);

        var result = await repo.GetUnreadByRecipientAsync("person-1");

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task MarkReadByIdAsyncCallsUpdateOne()
    {
        var mock = new Mock<IMongoCollection<Notification>>();
        mock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<Notification>>(),
                It.IsAny<UpdateDefinition<Notification>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<UpdateResult>());

        var repo = new NotificationRepository(mock.Object);
        await repo.MarkReadByIdAsync("n-1");

        mock.Verify(c => c.UpdateOneAsync(
            It.IsAny<FilterDefinition<Notification>>(),
            It.IsAny<UpdateDefinition<Notification>>(),
            It.IsAny<UpdateOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkAllReadByRecipientAsyncCallsUpdateMany()
    {
        var mock = new Mock<IMongoCollection<Notification>>();
        mock.Setup(c => c.UpdateManyAsync(
                It.IsAny<FilterDefinition<Notification>>(),
                It.IsAny<UpdateDefinition<Notification>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<UpdateResult>());

        var repo = new NotificationRepository(mock.Object);
        await repo.MarkAllReadByRecipientAsync("person-1");

        mock.Verify(c => c.UpdateManyAsync(
            It.IsAny<FilterDefinition<Notification>>(),
            It.IsAny<UpdateDefinition<Notification>>(),
            It.IsAny<UpdateOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Notification BuildNotification(string? id) =>
        new()
        {
            Id = id,
            RecipientPersonId = "person-1",
            Type = NotificationType.TransactionPendingConfirmation,
            TransactionId = "tx-1",
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
        };
}
