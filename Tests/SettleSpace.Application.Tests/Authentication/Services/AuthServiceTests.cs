using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Authentication.Mapping;
using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Auth;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;

namespace SettleSpace.Application.Tests.Authentication.Services;

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
            JwtKey = "settlespace-super-secret-jwt-key-2026-change-me",
            Issuer = "SettleSpace",
            Audience = "SettleSpaceReact",
            TokenExpirationMinutes = 60
        });

        return new AuthService(
            _personRepositoryMock.Object,
            settings,
            _passwordHashingServiceMock.Object,
            _personApplicationServiceMock.Object,
            _passwordValidatorMock.Object,
            new AuthMapper());
    }

    [Fact]
    public async Task LoginAsyncWithValidCredentialsReturnsTokenResponse()
    {
        var sut = CreateService();
        var passwordHash = Hash("Admin@123");
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = passwordHash });

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
    public async Task LoginAsyncWithInvalidCredentialsReturnsNull()
    {
        var sut = CreateService();
        var passwordHash = Hash("Admin@123");
        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = passwordHash });

        var result = await sut.LoginAsync(new LoginCommand
        {
            Username = "john.doe",
            Password = "wrong-password"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsyncWithLegacyPlaintextPasswordUpgradesStoredPassword()
    {
        var sut = CreateService();
        Person? updatedPerson = null;

        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("john", "doe"))
            .ReturnsAsync(new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = "Admin@123" });
        _personRepositoryMock
            .Setup(repository => repository.UpdateAsync("1", It.IsAny<Person>()))
            .Callback<string, Person>((_, person) => updatedPerson = person)
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
        _personRepositoryMock.Verify(repository => repository.UpdateAsync("1", It.IsAny<Person>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsyncWithInvalidUsernameFormatReturnsNull()
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
    public async Task RegisterAsyncWithValidCommandReturnsLoginResponse()
    {
        var sut = CreateService();
        var passwordHash = Hash("Strong@Pass1");

        _personApplicationServiceMock
            .Setup(service => service.CreatePersonAsync(It.Is<CreatePersonCommand>(command =>
                command.FirstName == "John" &&
                command.LastName == "Doe" &&
                command.Password == "Strong@Pass1")))
            .ReturnsAsync(new Person
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = passwordHash
            });

        _personRepositoryMock
            .Setup(repository => repository.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(new Person
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
    public async Task ChangePasswordAsyncWithValidCurrentPasswordUpdatesStoredHash()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");
        Person? updatedPerson = null;

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new Person
            {
                Id = "1",
                FirstName = "John",
                LastName = "Doe",
                Password = existingHash
            });
        _personRepositoryMock
            .Setup(repository => repository.UpdateAsync("1", It.IsAny<Person>()))
            .Callback<string, Person>((_, person) => updatedPerson = person)
            .Returns(Task.CompletedTask);

        var result = await sut.ChangePasswordAsync("1", new ChangePasswordCommand
        {
            CurrentPassword = "Admin@123",
            NewPassword = "NewStrong@123"
        });

        Assert.True(result);
        Assert.NotNull(updatedPerson);
        Assert.Equal(Hash("NewStrong@123"), updatedPerson!.Password);
        _personRepositoryMock.Verify(repository => repository.UpdateAsync("1", It.IsAny<Person>()), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsyncWithInvalidCurrentPasswordReturnsFalse()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new Person
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
        _personRepositoryMock.Verify(repository => repository.UpdateAsync(It.IsAny<string>(), It.IsAny<Person>()), Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsyncWithWeakNewPasswordThrowsWeakPasswordException()
    {
        var sut = CreateService();
        var existingHash = Hash("Admin@123");

        _personRepositoryMock
            .Setup(repository => repository.GetByIdAsync("1"))
            .ReturnsAsync(new Person
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

        _personRepositoryMock.Verify(repository => repository.UpdateAsync(It.IsAny<string>(), It.IsAny<Person>()), Times.Never);
    }

    [Fact]
    public void ResolveAuthContextWithValidClaimsReturnsPersonIdAndRole()
    {
        var sut = CreateService();
        var user = BuildUser("person-1", PersonRole.MANAGER);

        var result = sut.ResolveAuthContext(user);

        Assert.Equal("person-1", result.PersonId);
        Assert.Equal(PersonRole.MANAGER, result.Role);
    }

    [Fact]
    public void ResolveAuthContextWithMissingPersonIdThrowsAuthContextException()
    {
        var sut = CreateService();
        var user = new ClaimsPrincipal(
            new ClaimsIdentity(
                new[] { new Claim(CustomClaimTypes.PersonRole, PersonRole.USER.ToString()) },
                "TestAuth"));

        Assert.Throws<AuthContextException>(() => sut.ResolveAuthContext(user));
    }

    [Fact]
    public void ResolveAuthContextWithInvalidRoleFallsBackToUser()
    {
        var sut = CreateService();
        var user = new ClaimsPrincipal(
            new ClaimsIdentity(
                new[]
                {
                    new Claim(CustomClaimTypes.PersonId, "person-1"),
                    new Claim(CustomClaimTypes.PersonRole, "NOT_A_ROLE")
                },
                "TestAuth"));

        var result = sut.ResolveAuthContext(user);

        Assert.Equal("person-1", result.PersonId);
        Assert.Equal(PersonRole.USER, result.Role);
    }

    private static ClaimsPrincipal BuildUser(string personId, PersonRole role)
    {
        return new ClaimsPrincipal(
            new ClaimsIdentity(
                new[]
                {
                    new Claim(CustomClaimTypes.PersonId, personId),
                    new Claim(CustomClaimTypes.PersonRole, role.ToString())
                },
                "TestAuth"));
    }
}


