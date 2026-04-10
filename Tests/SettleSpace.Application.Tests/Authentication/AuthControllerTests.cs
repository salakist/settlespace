using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Moq;

namespace SettleSpace.Application.Tests.Authentication;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _controller = new AuthController(_authServiceMock.Object);
    }

    [Fact]
    public async Task LoginWithValidCredentialsReturnsOk()
    {
        var request = new LoginCommand { Username = "john.doe", Password = "Admin@123" };
        var response = new LoginResponseDto
        {
            Token = "token",
            Username = "John.Doe",
            PersonId = "person-1",
            DisplayName = "John Doe",
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
        };

        _authServiceMock.Setup(service => service.LoginAsync(request)).ReturnsAsync(response);

        var result = await _controller.Login(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<LoginResponseDto>(ok.Value);
        Assert.Equal("John.Doe", payload.Username);
        Assert.Equal("person-1", payload.PersonId);
        Assert.Equal("John Doe", payload.DisplayName);
    }

    [Fact]
    public async Task LoginWithInvalidCredentialsThrowsInvalidCredentialsException()
    {
        var request = new LoginCommand { Username = "john.doe", Password = "bad" };

        _authServiceMock.Setup(service => service.LoginAsync(request)).ReturnsAsync((LoginResponseDto?)null);

        var exception = await Assert.ThrowsAsync<InvalidCredentialsException>(() => _controller.Login(request));

        Assert.Equal("Invalid username or password.", exception.Message);
    }

    [Fact]
    public async Task RegisterWithValidRequestCreatesPersonAndReturnsLoginResponse()
    {
        var request = new RegisterCommand
        {
            FirstName = "John",
            LastName = "Doe",
            Password = "Strong@Pass1"
        };

        _authServiceMock
            .Setup(service => service.RegisterAsync(request))
            .ReturnsAsync(new LoginResponseDto
            {
                Token = "token",
                Username = "John.Doe",
                PersonId = "person-1",
                DisplayName = "John Doe",
                ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
            });

        var result = await _controller.Register(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<LoginResponseDto>(ok.Value);
        Assert.Equal("John.Doe", payload.Username);
        Assert.Equal("person-1", payload.PersonId);
        Assert.Equal("John Doe", payload.DisplayName);
    }

    [Fact]
    public async Task ChangePasswordWithValidRequestReturnsNoContent()
    {
        var request = new ChangePasswordCommand
        {
            CurrentPassword = "Admin@123",
            NewPassword = "NewStrong@123"
        };

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(CustomClaimTypes.PersonId, "1") },
                    "TestAuth"))
            }
        };

        _authServiceMock
            .Setup(service => service.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Returns(("1", PersonRole.USER));
        _authServiceMock
            .Setup(service => service.ChangePasswordAsync("1", request))
            .ReturnsAsync(true);

        var result = await _controller.ChangePassword(request);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task ChangePasswordWithInvalidCurrentPasswordThrowsInvalidCurrentPasswordException()
    {
        var request = new ChangePasswordCommand
        {
            CurrentPassword = "wrong",
            NewPassword = "NewStrong@123"
        };

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(CustomClaimTypes.PersonId, "1") },
                    "TestAuth"))
            }
        };

        _authServiceMock
            .Setup(service => service.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Returns(("1", PersonRole.USER));
        _authServiceMock
            .Setup(service => service.ChangePasswordAsync("1", request))
            .ReturnsAsync(false);

        var exception = await Assert.ThrowsAsync<InvalidCurrentPasswordException>(() => _controller.ChangePassword(request));

        Assert.Equal("Current password is invalid.", exception.Message);
    }
}


