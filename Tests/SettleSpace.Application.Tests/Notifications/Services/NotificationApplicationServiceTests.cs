using SettleSpace.Application.Notifications;
using SettleSpace.Application.Notifications.Mapping;
using SettleSpace.Application.Notifications.Services;
using SettleSpace.Domain.Notifications;
using SettleSpace.Domain.Notifications.Entities;
using SettleSpace.Domain.Notifications.Exceptions;
using Moq;

namespace SettleSpace.Application.Tests.Notifications.Services;

public class NotificationApplicationServiceTests
{
    private readonly Mock<INotificationRepository> _repositoryMock = new();
    private readonly INotificationMapper _mapper = new NotificationMapper();
    private readonly NotificationApplicationService _sut;

    public NotificationApplicationServiceTests()
    {
        _sut = new NotificationApplicationService(_repositoryMock.Object, _mapper);
    }

    [Fact]
    public async Task CreateAsyncInsertsNotificationWithCorrectFields()
    {
        _repositoryMock.Setup(r => r.CreateAsync(It.IsAny<Notification>()))
            .ReturnsAsync((Notification n) => n);

        await _sut.CreateAsync("person-1", NotificationType.TransactionPendingConfirmation, "tx-1");

        _repositoryMock.Verify(r => r.CreateAsync(It.Is<Notification>(n =>
            n.RecipientPersonId == "person-1" &&
            n.Type == NotificationType.TransactionPendingConfirmation &&
            n.TransactionId == "tx-1" &&
            !n.IsRead)), Times.Once);
    }

    [Fact]
    public async Task GetMyUnreadAsyncReturnsMappedDtos()
    {
        var notifications = new List<Notification>
        {
            BuildNotification("n-1", "person-1"),
            BuildNotification("n-2", "person-1"),
        };
        _repositoryMock.Setup(r => r.GetUnreadByRecipientAsync("person-1")).ReturnsAsync(notifications);

        var result = await _sut.GetMyUnreadAsync("person-1");

        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.IsType<NotificationDto>(dto));
    }

    [Fact]
    public async Task MarkReadAsyncThrowsWhenNotificationNotFound()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Notification?)null);

        await Assert.ThrowsAsync<NotificationNotFoundException>(() =>
            _sut.MarkReadAsync("missing", "person-1"));
    }

    [Fact]
    public async Task MarkReadAsyncThrowsWhenCallerIsNotOwner()
    {
        var notification = BuildNotification("n-1", "person-1");
        _repositoryMock.Setup(r => r.GetByIdAsync("n-1")).ReturnsAsync(notification);

        await Assert.ThrowsAsync<UnauthorizedNotificationAccessException>(() =>
            _sut.MarkReadAsync("n-1", "intruder"));
    }

    [Fact]
    public async Task MarkReadAsyncCallsRepositoryWhenOwnerMatches()
    {
        var notification = BuildNotification("n-1", "person-1");
        _repositoryMock.Setup(r => r.GetByIdAsync("n-1")).ReturnsAsync(notification);
        _repositoryMock.Setup(r => r.MarkReadByIdAsync("n-1")).Returns(Task.CompletedTask);

        await _sut.MarkReadAsync("n-1", "person-1");

        _repositoryMock.Verify(r => r.MarkReadByIdAsync("n-1"), Times.Once);
    }

    [Fact]
    public async Task MarkAllMyReadAsyncDelegatesToRepository()
    {
        _repositoryMock.Setup(r => r.MarkAllReadByRecipientAsync("person-1")).Returns(Task.CompletedTask);

        await _sut.MarkAllMyReadAsync("person-1");

        _repositoryMock.Verify(r => r.MarkAllReadByRecipientAsync("person-1"), Times.Once);
    }

    private static Notification BuildNotification(string id, string recipientPersonId) =>
        new()
        {
            Id = id,
            RecipientPersonId = recipientPersonId,
            Type = NotificationType.TransactionPendingConfirmation,
            TransactionId = "tx-1",
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
        };
}
