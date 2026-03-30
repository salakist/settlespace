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
}



