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
    private readonly Mock<IPasswordHashingService> _passwordHashingServiceMock = new();
    private readonly PersonApplicationService _sut;

    public PersonApplicationServiceTests()
    {
        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Returns<string>(password => $"hashed::{password}");

        _sut = new PersonApplicationService(
            _repositoryMock.Object,
            _domainServiceMock.Object,
            _passwordHashingServiceMock.Object);
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
        var command  = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        PersonEntity? capturedPerson = null;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PersonEntity>()))
                       .Callback<PersonEntity>(person => capturedPerson = person)
                       .ReturnsAsync((PersonEntity person) =>
                       {
                           person.Id = "new1";
                           return person;
                       });

        var result = await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Strong@Pass1", capturedPerson!.Password);
        Assert.Equal("hashed::Strong@Pass1", result.Password);
        _domainServiceMock.Verify(d => d.EnsureUniqueAsync("John", "Doe", null), Times.Once);
        _passwordHashingServiceMock.Verify(service => service.HashPassword("Strong@Pass1"), Times.Once);
    }

    [Fact]
    public async Task CreatePersonAsync_NoPassword_GeneratesValidPassword()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = null };
        var capturedPerson = (PersonEntity?)null;
        var hashedPasswordInput = string.Empty;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Callback<string>(password => hashedPasswordInput = password)
            .Returns<string>(password => $"hashed::{password}");
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PersonEntity>()))
                       .Callback<PersonEntity>(p => capturedPerson = p)
                       .ReturnsAsync(new PersonEntity { Id = "new1", FirstName = "John", LastName = "Doe", Password = "Generated" });

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.NotNull(capturedPerson!.Password);
        Assert.StartsWith("hashed::", capturedPerson.Password);
        Assert.NotEmpty(hashedPasswordInput);
        Assert.True(hashedPasswordInput.Length >= 8);
    }

    [Fact]
    public async Task CreatePersonAsync_EmptyPassword_GeneratesValidPassword()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "" };
        var capturedPerson = (PersonEntity?)null;
        var hashedPasswordInput = string.Empty;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Callback<string>(password => hashedPasswordInput = password)
            .Returns<string>(password => $"hashed::{password}");
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PersonEntity>()))
                       .Callback<PersonEntity>(p => capturedPerson = p)
                       .ReturnsAsync(new PersonEntity { Id = "new1", FirstName = "John", LastName = "Doe", Password = "Generated" });

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.NotNull(capturedPerson!.Password);
        Assert.StartsWith("hashed::", capturedPerson.Password);
        Assert.NotEmpty(hashedPasswordInput);
        Assert.True(hashedPasswordInput.Length >= 8);
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

    [Fact]
    public async Task CreatePersonAsync_WeakPassword_ThrowsWeakPasswordException()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "weak" };

        await Assert.ThrowsAsync<WeakPasswordException>(
            () => _sut.CreatePersonAsync(command));
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdatePersonAsync_ValidCommand_UpdatesPerson()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Doe", Password = "Strong@Pass2" };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Old@Pass1" };
        PersonEntity? capturedPerson = null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()))
                       .Callback<string, PersonEntity>((_, person) => capturedPerson = person)
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync(command);

        _domainServiceMock.Verify(d => d.EnsureUniqueAsync("Jane", "Doe", "1"), Times.Once);
        _repositoryMock.Verify(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()), Times.Once);
        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Strong@Pass2", capturedPerson!.Password);
        _passwordHashingServiceMock.Verify(service => service.HashPassword("Strong@Pass2"), Times.Once);
    }

    [Fact]
    public async Task UpdatePersonAsync_NoPassword_PreservesExistingPassword()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Doe", Password = null };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Existing@Pass1" };
        var capturedPerson = (PersonEntity?)null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()))
                       .Callback<string, PersonEntity>((id, p) => capturedPerson = p)
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Existing@Pass1", capturedPerson!.Password);
        _passwordHashingServiceMock.Verify(service => service.HashPassword(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePersonAsync_EmptyPassword_PreservesExistingPassword()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Doe", Password = "" };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Existing@Pass1" };
        var capturedPerson = (PersonEntity?)null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<PersonEntity>()))
                       .Callback<string, PersonEntity>((id, p) => capturedPerson = p)
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Existing@Pass1", capturedPerson!.Password);
        _passwordHashingServiceMock.Verify(service => service.HashPassword(It.IsAny<string>()), Times.Never);
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

    [Fact]
    public async Task UpdatePersonAsync_WeakPassword_ThrowsWeakPasswordException()
    {
        var command  = new UpdatePersonCommand { Id = "1", FirstName = "Jane", LastName = "Doe", Password = "weak" };
        var existing = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);

        await Assert.ThrowsAsync<WeakPasswordException>(
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
