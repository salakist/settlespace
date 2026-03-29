using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;
using Moq;

namespace FoTestApi.Domain.Tests.Services;

public class PersonDomainServiceTests
{
    private readonly Mock<IPersonRepository> _repositoryMock = new();
    private readonly PersonDomainService _sut;

    public PersonDomainServiceTests()
    {
        _sut = new PersonDomainService(_repositoryMock.Object);
    }

    [Fact]
    public async Task EnsureUniqueAsync_NoExistingPerson_DoesNotThrow()
    {
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync((PersonEntity?)null);

        var ex = await Record.ExceptionAsync(() => _sut.EnsureUniqueAsync("John", "Doe"));

        Assert.Null(ex);
    }

    [Fact]
    public async Task EnsureUniqueAsync_DuplicatePerson_ThrowsDuplicatePersonException()
    {
        var existing = new PersonEntity { Id = "abc123", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.EnsureUniqueAsync("John", "Doe"));
    }

    [Fact]
    public async Task EnsureUniqueAsync_ExcludeIdMatchesExisting_DoesNotThrow()
    {
        // When updating, passing the same person's ID should not throw
        var existing = new PersonEntity { Id = "abc123", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        var ex = await Record.ExceptionAsync(() => _sut.EnsureUniqueAsync("John", "Doe", "abc123"));

        Assert.Null(ex);
    }

    [Fact]
    public async Task EnsureUniqueAsync_ExcludeIdDiffersFromExisting_ThrowsDuplicatePersonException()
    {
        // Another person already has the same name; the excluded ID is different
        var existing = new PersonEntity { Id = "other456", FirstName = "John", LastName = "Doe" };
        _repositoryMock
            .Setup(r => r.FindByFullNameAsync("John", "Doe"))
            .ReturnsAsync(existing);

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.EnsureUniqueAsync("John", "Doe", "abc123"));
    }
}
