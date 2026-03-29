using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Application.Services;
using FoTestApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace FoTestApi.Application.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _controller = new AuthController(_authServiceMock.Object);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOk()
    {
        var request = new LoginCommand { Username = "john.doe", Password = "Admin@123" };
        var response = new LoginResponseDto
        {
            Token = "token",
            Username = "John.Doe",
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
        };

        _authServiceMock.Setup(service => service.LoginAsync(request)).ReturnsAsync(response);

        var result = await _controller.Login(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<LoginResponseDto>(ok.Value);
        Assert.Equal("John.Doe", payload.Username);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var request = new LoginCommand { Username = "john.doe", Password = "bad" };

        _authServiceMock.Setup(service => service.LoginAsync(request)).ReturnsAsync((LoginResponseDto?)null);

        var result = await _controller.Login(request);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }
}