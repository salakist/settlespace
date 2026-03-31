using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Persons.Exceptions;
using FoTestApi.Domain.Persons;
using FoTestApi.Domain.Persons.Services;
using Moq;

namespace FoTestApi.Domain.Tests.Persons.Services;

public class PersonDomainServiceTests
{
    private readonly Mock<IPersonRepository> _repositoryMock = new();
    private readonly PersonDomainService _sut;

    public PersonDomainServiceTests()
    {
        _sut = new PersonDomainService(_repositoryMock.Object);
    }

    [Fact]
    public async Task EnsureUniqueAsyncNoExistingPersonDoesNotThrow()
    {
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync((Person?)null);

        var ex = await Record.ExceptionAsync(() => _sut.EnsureUniqueAsync("John", "Doe"));

        Assert.Null(ex);
    }

    [Fact]
    public async Task EnsureUniqueAsyncDuplicatePersonThrowsDuplicatePersonException()
    {
        var existing = new Person { Id = "abc123", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.EnsureUniqueAsync("John", "Doe"));
    }

    [Fact]
    public async Task EnsureUniqueAsyncExcludeIdMatchesExistingDoesNotThrow()
    {
        // When updating, passing the same person's ID should not throw
        var existing = new Person { Id = "abc123", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        var ex = await Record.ExceptionAsync(() => _sut.EnsureUniqueAsync("John", "Doe", "abc123"));

        Assert.Null(ex);
    }

    [Fact]
    public async Task EnsureUniqueAsyncExcludeIdDiffersFromExistingThrowsDuplicatePersonException()
    {
        // Another person already has the same name; the excluded ID is different
        var existing = new Person { Id = "other456", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.EnsureUniqueAsync("John", "Doe", "abc123"));
    }

    [Fact]
    public void EnsureCanCreateManagedPersonUserThrowsUnauthorizedPersonAccessException()
    {
        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanCreateManagedPerson(PersonRole.USER, PersonRole.USER));
    }

    [Fact]
    public void EnsureCanCreateManagedPersonManagerCreatingAdminThrowsUnauthorizedPersonAccessException()
    {
        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanCreateManagedPerson(PersonRole.MANAGER, PersonRole.ADMIN));
    }

    [Fact]
    public void EnsureCanCreateManagedPersonManagerCreatingUserDoesNotThrow()
    {
        var ex = Record.Exception(
            () => _sut.EnsureCanCreateManagedPerson(PersonRole.MANAGER, PersonRole.USER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanCreateManagedPersonAdminCreatingManagerDoesNotThrow()
    {
        var ex = Record.Exception(
            () => _sut.EnsureCanCreateManagedPerson(PersonRole.ADMIN, PersonRole.MANAGER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanUpdateManagedPersonUserThrowsUnauthorizedPersonAccessException()
    {
        var target = new Person { Id = "p2", Role = PersonRole.USER };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanUpdateManagedPerson(PersonRole.USER, "p1", target, PersonRole.USER));
    }

    [Fact]
    public void EnsureCanUpdateManagedPersonManagerCannotUpdateAdmin()
    {
        var target = new Person { Id = "p2", Role = PersonRole.ADMIN };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanUpdateManagedPerson(PersonRole.MANAGER, "p1", target, PersonRole.ADMIN));
    }

    [Fact]
    public void EnsureCanUpdateManagedPersonManagerCannotChangeRole()
    {
        var target = new Person { Id = "p2", Role = PersonRole.USER };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanUpdateManagedPerson(PersonRole.MANAGER, "p1", target, PersonRole.MANAGER));
    }

    [Fact]
    public void EnsureCanUpdateManagedPersonSelfRoleChangeThrowsUnauthorizedPersonAccessException()
    {
        var target = new Person { Id = "p1", Role = PersonRole.MANAGER };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanUpdateManagedPerson(PersonRole.ADMIN, "p1", target, PersonRole.ADMIN));
    }

    [Fact]
    public void EnsureCanUpdateManagedPersonAdminValidUpdateDoesNotThrow()
    {
        var target = new Person { Id = "p2", Role = PersonRole.USER };

        var ex = Record.Exception(
            () => _sut.EnsureCanUpdateManagedPerson(PersonRole.ADMIN, "p1", target, PersonRole.MANAGER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanDeleteManagedPersonUserThrowsUnauthorizedPersonAccessException()
    {
        var target = new Person { Id = "p2", Role = PersonRole.USER };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanDeleteManagedPerson(PersonRole.USER, target));
    }

    [Fact]
    public void EnsureCanDeleteManagedPersonManagerCannotDeleteAdmin()
    {
        var target = new Person { Id = "p2", Role = PersonRole.ADMIN };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanDeleteManagedPerson(PersonRole.MANAGER, target));
    }

    [Fact]
    public void EnsureCanDeleteManagedPersonManagerCanDeleteUser()
    {
        var target = new Person { Id = "p2", Role = PersonRole.USER };

        var ex = Record.Exception(
            () => _sut.EnsureCanDeleteManagedPerson(PersonRole.MANAGER, target));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanUpdateSelfRoleChangeThrowsUnauthorizedPersonAccessException()
    {
        var existing = new Person { Id = "p1", Role = PersonRole.USER };

        Assert.Throws<UnauthorizedPersonAccessException>(
            () => _sut.EnsureCanUpdateSelf(existing, PersonRole.ADMIN));
    }

    [Fact]
    public void EnsureCanUpdateSelfWithoutRoleChangeDoesNotThrow()
    {
        var existing = new Person { Id = "p1", Role = PersonRole.USER };

        var ex = Record.Exception(() => _sut.EnsureCanUpdateSelf(existing, PersonRole.USER));

        Assert.Null(ex);
    }
}



