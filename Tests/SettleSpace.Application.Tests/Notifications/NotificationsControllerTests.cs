using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Domain.Auth;
using SettleSpace.Application.Notifications;
using SettleSpace.Application.Notifications.Services;
using SettleSpace.Domain.Notifications.Entities;
using SettleSpace.Domain.Persons.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace SettleSpace.Application.Tests.Notifications;

public class NotificationsControllerTests
{
    private readonly Mock<INotificationApplicationService> _serviceMock = new();
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly NotificationsController _controller;

    public NotificationsControllerTests()
    {
        _controller = new NotificationsController(
            _serviceMock.Object,
            _authServiceMock.Object);
    }

    [Fact]
    public async Task GetUnreadReturnsOkWithDtos()
    {
        var dtos = new List<NotificationDto> { BuildDto("n-1") };
        _serviceMock.Setup(s => s.GetMyUnreadAsync("person-1")).ReturnsAsync(dtos);
        SetUser("person-1", PersonRole.USER);

        var result = await _controller.GetUnread();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<List<NotificationDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task MarkReadReturnsNoContent()
    {
        _serviceMock.Setup(s => s.MarkReadAsync("507f1f77bcf86cd799439011", "person-1"))
            .Returns(Task.CompletedTask);
        SetUser("person-1", PersonRole.USER);

        var result = await _controller.MarkRead("507f1f77bcf86cd799439011");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task MarkAllReadReturnsNoContent()
    {
        _serviceMock.Setup(s => s.MarkAllMyReadAsync("person-1")).Returns(Task.CompletedTask);
        SetUser("person-1", PersonRole.USER);

        var result = await _controller.MarkAllRead();

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task GetUnreadThrowsAuthContextExceptionWhenClaimMissing()
    {
        _authServiceMock.Setup(s => s.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Throws<AuthContextException>();

        await Assert.ThrowsAsync<AuthContextException>(() => _controller.GetUnread());
    }

    private void SetUser(string personId, PersonRole role)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(CustomClaimTypes.PersonId, personId),
                        new Claim(CustomClaimTypes.PersonRole, role.ToString())
                    ],
                    "TestAuth"))
            }
        };

        _authServiceMock
            .Setup(s => s.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Returns((personId, role));
    }

    private static NotificationDto BuildDto(string id) =>
        new()
        {
            Id = id,
            Type = NotificationType.TransactionPendingConfirmation,
            TransactionId = "tx-1",
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
        };
}
