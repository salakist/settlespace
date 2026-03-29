using FoTestApi.Application.Authentication;
using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Application.Services;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Entities;
using Microsoft.Extensions.Options;
using Moq;

namespace FoTestApi.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IPersonRepository> _personRepositoryMock = new();

    private AuthService CreateService()
    {
        var settings = Options.Create(new AuthSettings
        {
            JwtKey = "fo-test-super-secret-jwt-key-2026-change-me",
            Issuer = "FoTestApi",
            Audience = "FoTestReact",
            TokenExpirationMinutes = 60
        });

        return new AuthService(_personRepositoryMock.Object, settings);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenResponse()
    {
        var sut = CreateService();
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new PersonEntity { FirstName = "John", LastName = "Doe", Password = "Admin@123" });

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "john.doe",
            Password = "Admin@123"
        });

        Assert.NotNull(result);
        Assert.Equal("John.Doe", result!.Username);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.True(result.ExpiresAtUtc > DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ReturnsNull()
    {
        var sut = CreateService();
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new PersonEntity { FirstName = "John", LastName = "Doe", Password = "Admin@123" });

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "john.doe",
            Password = "wrong-password"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidUsernameFormat_ReturnsNull()
    {
        var sut = CreateService();

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "johndoe",
            Password = "whatever"
        });

        Assert.Null(result);
        _personRepositoryMock.Verify(repository => repository.FindByFullNameAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }
}