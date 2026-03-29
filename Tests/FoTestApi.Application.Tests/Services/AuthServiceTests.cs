using FoTestApi.Application.Authentication;
using FoTestApi.Application.Commands;
using FoTestApi.Application.Services;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;
using Microsoft.Extensions.Options;
using Moq;

namespace FoTestApi.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IPersonRepository> _personRepositoryMock = new();
    private readonly IPasswordHashingService _passwordHashingService = new PasswordHashingService();

    private AuthService CreateService()
    {
        var settings = Options.Create(new AuthSettings
        {
            JwtKey = "fo-test-super-secret-jwt-key-2026-change-me",
            Issuer = "FoTestApi",
            Audience = "FoTestReact",
            TokenExpirationMinutes = 60
        });

        return new AuthService(_personRepositoryMock.Object, settings, _passwordHashingService);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenResponse()
    {
        var sut = CreateService();
        var passwordHash = _passwordHashingService.HashPassword("Admin@123");
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = passwordHash });

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
        var passwordHash = _passwordHashingService.HashPassword("Admin@123");
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = passwordHash });

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "john.doe",
            Password = "wrong-password"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WithLegacyPlaintextPassword_UpgradesStoredPassword()
    {
        var sut = CreateService();
        PersonEntity? updatedPerson = null;

        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = "Admin@123" });
        _personRepositoryMock
            .Setup(repository => repository.UpdateAsync("1", It.IsAny<PersonEntity>()))
            .Callback<string, PersonEntity>((_, person) => updatedPerson = person)
            .Returns(Task.CompletedTask);

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "john.doe",
            Password = "Admin@123"
        });

        Assert.NotNull(result);
        Assert.NotNull(updatedPerson);
        Assert.NotEqual("Admin@123", updatedPerson!.Password);
        Assert.True(_passwordHashingService.IsPasswordHash(updatedPerson.Password!));
        _personRepositoryMock.Verify(repository => repository.UpdateAsync("1", It.IsAny<PersonEntity>()), Times.Once);
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