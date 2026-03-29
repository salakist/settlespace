using FoTestApi.Application.Authentication;
using FoTestApi.Application.Commands;
using FoTestApi.Application.Services;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;
using Microsoft.Extensions.Options;
using Moq;

namespace FoTestApi.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IPersonRepository> _personRepositoryMock = new();
    private readonly Mock<IPersonApplicationService> _personApplicationServiceMock = new();
    private readonly Mock<IPasswordValidator> _passwordValidatorMock = new();
    private readonly Mock<IPasswordHashingService> _passwordHashingServiceMock = new();

    private static string Hash(string password) => $"hashed::{password}";

    public AuthServiceTests()
    {
        _passwordValidatorMock
            .Setup(validator => validator.Validate("weak"))
            .Throws(new WeakPasswordException("Password is too weak."));

        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Returns<string>(Hash);
        _passwordHashingServiceMock
            .Setup(service => service.IsPasswordHash(It.IsAny<string>()))
            .Returns<string>(value => value.StartsWith("hashed::", StringComparison.Ordinal));
        _passwordHashingServiceMock
            .Setup(service => service.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()))
            .Returns<string, string>((password, passwordHash) =>
                string.Equals(passwordHash, Hash(password), StringComparison.Ordinal));
    }

    private AuthService CreateService()
    {
        var settings = Options.Create(new AuthSettings
        {
            JwtKey = "fo-test-super-secret-jwt-key-2026-change-me",
            Issuer = "FoTestApi",
            Audience = "FoTestReact",
            TokenExpirationMinutes = 60
        });

        return new AuthService(
            _personRepositoryMock.Object,
            settings,
            _passwordHashingServiceMock.Object,
            _personApplicationServiceMock.Object,
            _passwordValidatorMock.Object);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenResponse()
    {
        var sut = CreateService();
        var passwordHash = Hash("Admin@123");
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
        var passwordHash = Hash("Admin@123");
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
        Assert.StartsWith("hashed::", updatedPerson.Password!);
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

    [Fact]
    public async Task RegisterAsync_WithValidCommand_ReturnsLoginResponse()
    {
        var sut = CreateService();
        var passwordHash = Hash("Strong@Pass1");

        _personApplicationServiceMock
            .Setup(service => service.CreatePersonAsync(It.Is<CreatePersonCommand>(command =>
                command.FirstName == "John" &&
                command.LastName == "Doe" &&
                command.Password == "Strong@Pass1")))
            .ReturnsAsync(new PersonEntity
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = passwordHash
            });

        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(new PersonEntity
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = passwordHash
            });

        var result = await sut.RegisterAsync(new RegisterCommand
        {
            FirstName = "John",
            LastName = "Doe",
            Password = "Strong@Pass1"
        });

        Assert.Equal("John.Doe", result.Username);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
    }

    [Fact]
    public async Task ChangePasswordAsync_WithValidCurrentPassword_UpdatesStoredHash()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");
        PersonEntity? updatedPerson = null;

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new PersonEntity
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = existingHash
            });
        _personRepositoryMock
            .Setup(repository => repository.UpdateAsync("1", It.IsAny<PersonEntity>()))
            .Callback<string, PersonEntity>((_, person) => updatedPerson = person)
            .Returns(Task.CompletedTask);

        var result = await sut.ChangePasswordAsync("1", new ChangePasswordCommand
        {
            CurrentPassword = "Admin@123",
            NewPassword = "NewStrong@123"
        });

        Assert.True(result);
        Assert.NotNull(updatedPerson);
        Assert.Equal(Hash("NewStrong@123"), updatedPerson!.Password);
        _personRepositoryMock.Verify(repository => repository.UpdateAsync("1", It.IsAny<PersonEntity>()), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithInvalidCurrentPassword_ReturnsFalse()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new PersonEntity
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = existingHash
            });

        var result = await sut.ChangePasswordAsync("1", new ChangePasswordCommand
        {
            CurrentPassword = "Wrong@123",
            NewPassword = "NewStrong@123"
        });

        Assert.False(result);
        _personRepositoryMock.Verify(repository => repository.UpdateAsync(It.IsAny<string>(), It.IsAny<PersonEntity>()), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithWeakNewPassword_ThrowsWeakPasswordException()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new PersonEntity
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = existingHash
            });

        await Assert.ThrowsAsync<WeakPasswordException>(() =>
            sut.ChangePasswordAsync("1", new ChangePasswordCommand
            {
                CurrentPassword = "Admin@123",
                NewPassword = "weak"
            }));

        _personRepositoryMock.Verify(repository => repository.UpdateAsync(It.IsAny<string>(), It.IsAny<PersonEntity>()), Times.Never);
    }
}