using FoTestApi.Application.Commands;
using FoTestApi.Application.Services;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;
using Moq;

namespace FoTestApi.Application.Tests.Services;

public class PersonApplicationServiceTests
{
    private readonly Mock<IPersonRepository> _repositoryMock = new();
    private readonly Mock<IPersonDomainService> _domainServiceMock = new();
    private readonly PersonApplicationService _sut;

    public PersonApplicationServiceTests()
    {
        _sut = new PersonApplicationService(_repositoryMock.Object, _domainServiceMock.Object);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetAllPersonsAsync_ReturnsAllPersons()
    {
        var persons = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" }
        };
        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(persons);

        var result = await _sut.GetAllPersonsAsync();

        Assert.Equal(persons, result);
    }

    [Fact]
    public async Task GetPersonByIdAsync_ExistingId_ReturnsPerson()
    {
        var person = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };
        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(person);

        var result = await _sut.GetPersonByIdAsync("1");

        Assert.Equal(person, result);
    }

    [Fact]
    public async Task GetPersonByIdAsync_UnknownId_ReturnsNull()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync("unknown")).ReturnsAsync((PersonEntity?)null);

        var result = await _sut.GetPersonByIdAsync("unknown");

        Assert.Null(result);
    }

    [Fact]
    public async Task SearchPersonsAsync_ReturnsMatchingPersons()
    {
        var persons = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" }
        };
        _repositoryMock.Setup(r => r.SearchAsync("John")).ReturnsAsync(persons);

        var result = await _sut.SearchPersonsAsync("John");

        Assert.Equal(persons, result);
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreatePersonAsync_ValidCommand_CreatesAndReturnsPerson()
    {
        var command  = new CreatePersonCommand { FirstName = "John", LastName = "Doe" };
        var expected = new PersonEntity { Id = "new1", FirstName = "John", LastName = "Doe" };

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PersonEntity>()))
                       .ReturnsAsync(expected);

        var result = await _sut.CreatePersonAsync(command);

        Assert.Equal(expected, result);
        _domainServiceMock.Verify(d => d.EnsureUniqueAsync("John", "Doe", null), Times.Once);
    }

    [Theory]
    [InlineData("", "Doe")]
    [InlineData("John", "")]
    [InlineData("   ", "Doe")]
    public async Task CreatePersonAsync_InvalidNames_ThrowsInvalidOperationException(
        string firstName, string lastName)
    {
        var command = new CreatePersonCommand { FirstName = firstName, LastName = lastName };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.CreatePersonAsync(command));
    }

    [Fact]
    public async Task CreatePersonAsync_DuplicatePerson_ThrowsDuplicatePersonException()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe" };

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .ThrowsAsync(new DuplicatePersonException("John", "Doe"));

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.CreatePersonAsync(command));
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdatePersonAsync_ValidCommand_UpdatesPerson()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Doe" };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()))
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync(command);

        _domainServiceMock.Verify(d => d.EnsureUniqueAsync("Jane", "Doe", "1"), Times.Once);
        _repositoryMock.Verify(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePersonAsync_PersonNotFound_ThrowsInvalidOperationException()
    {
        var command = new UpdatePersonCommand { Id = "missing", FirstName = "Jane", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("missing"))
                       .ReturnsAsync((PersonEntity?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.UpdatePersonAsync(command));
    }

    [Fact]
    public async Task UpdatePersonAsync_NameTakenByAnotherPerson_ThrowsDuplicatePersonException()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Smith" };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Smith", "1"))
            .ThrowsAsync(new DuplicatePersonException("Jane", "Smith"));

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.UpdatePersonAsync(command));
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeletePersonAsync_ExistingPerson_DeletesPerson()
    {
        var person  = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };
        var command = new DeletePersonCommand { Id = "1" };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(person);
        _repositoryMock.Setup(r => r.DeleteAsync("1")).Returns(Task.CompletedTask);

        await _sut.DeletePersonAsync(command);

        _repositoryMock.Verify(r => r.DeleteAsync("1"), Times.Once);
    }

    [Fact]
    public async Task DeletePersonAsync_PersonNotFound_ThrowsInvalidOperationException()
    {
        var command = new DeletePersonCommand { Id = "missing" };

        _repositoryMock.Setup(r => r.GetByIdAsync("missing"))
                       .ReturnsAsync((PersonEntity?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.DeletePersonAsync(command));
    }
}
