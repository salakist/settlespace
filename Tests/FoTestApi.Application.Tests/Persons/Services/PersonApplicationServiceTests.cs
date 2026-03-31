using FoTestApi.Application.Persons.Commands;
using FoTestApi.Application.Persons.Mapping;
using FoTestApi.Application.Persons.Services;
using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Persons;
using FoTestApi.Domain.Persons.Exceptions;
using FoTestApi.Domain.Auth;
using FoTestApi.Domain.Persons.Services;
using Moq;

namespace FoTestApi.Application.Tests.Persons.Services;

public class PersonApplicationServiceTests
{
    private readonly Mock<IPersonRepository> _repositoryMock = new();
    private readonly Mock<IPersonDomainService> _domainServiceMock = new();
    private readonly Mock<IPasswordHashingService> _passwordHashingServiceMock = new();
    private readonly Mock<IPasswordValidator> _passwordValidatorMock = new();
    private readonly Mock<IPasswordGenerator> _passwordGeneratorMock = new();
    private readonly IPersonMapper _personMapper = new PersonMapper();
    private readonly PersonApplicationService _sut;

    public PersonApplicationServiceTests()
    {
        _passwordValidatorMock
            .Setup(service => service.Validate("weak"))
            .Throws(new WeakPasswordException("Password is too weak."));

        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Returns<string>(password => $"hashed::{password}");

        _passwordGeneratorMock
            .Setup(generator => generator.GeneratePassword())
            .Returns("Generated@Pass1");

        _sut = new PersonApplicationService(
            _repositoryMock.Object,
            _domainServiceMock.Object,
            _passwordHashingServiceMock.Object,
            _passwordValidatorMock.Object,
            _passwordGeneratorMock.Object,
            _personMapper);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetPersonByIdAsyncExistingIdReturnsPerson()
    {
        var person = new Person { Id = "1", FirstName = "John", LastName = "Doe" };
        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(person);

        var result = await _sut.GetPersonByIdAsync("1");

        Assert.Equal(person, result);
    }

    [Fact]
    public async Task GetPersonByIdAsyncUnknownIdReturnsNull()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync("unknown")).ReturnsAsync((Person?)null);

        var result = await _sut.GetPersonByIdAsync("unknown");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetPersonsAsyncAuthorizedRoleReturnsAllPersons()
    {
        var persons = new List<Person>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe", Role = PersonRole.ADMIN }
        };

        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(persons);

        var result = await _sut.GetPersonsAsync("admin-1", PersonRole.ADMIN);

        Assert.Equal(persons, result);
        _domainServiceMock.Verify(d => d.EnsureCanAccessDirectory(PersonRole.ADMIN), Times.Once);
    }

    [Fact]
    public async Task SearchPersonsAsyncAuthorizedRoleReturnsMatches()
    {
        var persons = new List<Person>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe", Role = PersonRole.USER }
        };

        _repositoryMock.Setup(r => r.SearchAsync("John")).ReturnsAsync(persons);

        var result = await _sut.SearchPersonsAsync("John", "manager-1", PersonRole.MANAGER);

        Assert.Equal(persons, result);
        _domainServiceMock.Verify(d => d.EnsureCanAccessDirectory(PersonRole.MANAGER), Times.Once);
    }

    [Fact]
    public async Task GetPersonByIdAsyncWithContextChecksAccessBeforeLoading()
    {
        var person = new Person { Id = "1", FirstName = "John", LastName = "Doe", Role = PersonRole.USER };
        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(person);

        var result = await _sut.GetPersonByIdAsync("1", "manager-1", PersonRole.MANAGER);

        Assert.Equal(person, result);
        _domainServiceMock.Verify(d => d.EnsureCanAccessDirectory(PersonRole.MANAGER), Times.Once);
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    [Fact]
    public async Task CreatePersonAsyncValidCommandCreatesAndReturnsPerson()
    {
        var command  = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        Person? capturedPerson = null;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
                       .Callback<Person>(person => capturedPerson = person)
                       .ReturnsAsync((Person person) =>
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
        _passwordGeneratorMock.Verify(generator => generator.GeneratePassword(), Times.Never);
    }

    [Fact]
    public async Task CreatePersonAsyncNoPasswordGeneratesValidPassword()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = null };
        var capturedPerson = (Person?)null;
        var hashedPasswordInput = string.Empty;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Callback<string>(password => hashedPasswordInput = password)
            .Returns<string>(password => $"hashed::{password}");
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
                       .Callback<Person>(p => capturedPerson = p)
                       .ReturnsAsync(new Person { Id = "new1", FirstName = "John", LastName = "Doe", Password = "Generated" });

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.NotNull(capturedPerson!.Password);
        Assert.StartsWith("hashed::", capturedPerson.Password);
        Assert.NotEmpty(hashedPasswordInput);
        Assert.True(hashedPasswordInput.Length >= 8);
        Assert.Equal("Generated@Pass1", hashedPasswordInput);
        _passwordGeneratorMock.Verify(generator => generator.GeneratePassword(), Times.Once);
    }

    [Fact]
    public async Task CreatePersonAsyncEmptyPasswordGeneratesValidPassword()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "" };
        var capturedPerson = (Person?)null;
        var hashedPasswordInput = string.Empty;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _passwordHashingServiceMock
            .Setup(service => service.HashPassword(It.IsAny<string>()))
            .Callback<string>(password => hashedPasswordInput = password)
            .Returns<string>(password => $"hashed::{password}");
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
                       .Callback<Person>(p => capturedPerson = p)
                       .ReturnsAsync(new Person { Id = "new1", FirstName = "John", LastName = "Doe", Password = "Generated" });

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.NotNull(capturedPerson!.Password);
        Assert.StartsWith("hashed::", capturedPerson.Password);
        Assert.NotEmpty(hashedPasswordInput);
        Assert.True(hashedPasswordInput.Length >= 8);
        Assert.Equal("Generated@Pass1", hashedPasswordInput);
        _passwordGeneratorMock.Verify(generator => generator.GeneratePassword(), Times.Once);
    }

    [Theory]
    [InlineData("", "Doe")]
    [InlineData("John", "")]
    [InlineData("   ", "Doe")]
    public async Task CreatePersonAsyncInvalidNamesThrowsInvalidOperationException(
        string firstName, string lastName)
    {
        var command = new CreatePersonCommand { FirstName = firstName, LastName = lastName };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.CreatePersonAsync(command));
    }

    [Fact]
    public async Task CreatePersonAsyncDuplicatePersonThrowsDuplicatePersonException()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe" };

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .ThrowsAsync(new DuplicatePersonException("John", "Doe"));

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.CreatePersonAsync(command));
    }

    [Fact]
    public async Task CreatePersonAsyncWeakPasswordThrowsWeakPasswordException()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "weak" };

        await Assert.ThrowsAsync<WeakPasswordException>(
            () => _sut.CreatePersonAsync(command));
    }

    [Fact]
    public async Task CreatePersonAsyncWithRequestedRoleSkipsBootstrapLookup()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1", Role = PersonRole.MANAGER };
        Person? capturedPerson = null;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
            .Callback<Person>(person => capturedPerson = person)
            .ReturnsAsync((Person person) => person);

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal(PersonRole.MANAGER, capturedPerson!.Role);
        _repositoryMock.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task CreatePersonAsyncWithoutRequestedRoleBootstrapsAdminForFirstPerson()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        Person? capturedPerson = null;

        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Person>());
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
            .Callback<Person>(person => capturedPerson = person)
            .ReturnsAsync((Person person) => person);

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal(PersonRole.ADMIN, capturedPerson!.Role);
    }

    [Fact]
    public async Task CreatePersonAsyncWithoutRequestedRoleDefaultsToUserWhenRepositoryNotEmpty()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1" };
        Person? capturedPerson = null;

        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Person>
        {
            new() { Id = "existing", FirstName = "Existing", LastName = "User", Role = PersonRole.ADMIN }
        });
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
            .Callback<Person>(person => capturedPerson = person)
            .ReturnsAsync((Person person) => person);

        await _sut.CreatePersonAsync(command);

        Assert.NotNull(capturedPerson);
        Assert.Equal(PersonRole.USER, capturedPerson!.Role);
    }

    [Fact]
    public async Task CreatePersonAsyncManagedPersonUsesRequestedRoleAndAuthorization()
    {
        var command = new CreatePersonCommand { FirstName = "John", LastName = "Doe", Password = "Strong@Pass1", Role = PersonRole.MANAGER };
        Person? capturedPerson = null;

        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("John", "Doe", null))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Person>()))
            .Callback<Person>(person => capturedPerson = person)
            .ReturnsAsync((Person person) => person);

        await _sut.CreatePersonAsync(command, "admin-1", PersonRole.ADMIN);

        Assert.NotNull(capturedPerson);
        Assert.Equal(PersonRole.MANAGER, capturedPerson!.Role);
        _domainServiceMock.Verify(d => d.EnsureCanCreateManagedPerson(PersonRole.ADMIN, PersonRole.MANAGER), Times.Once);
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    [Fact]
    public async Task UpdatePersonAsyncValidCommandUpdatesPerson()
    {
        var command  = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        var existing = new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Old@Pass1" };
        Person? capturedPerson = null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<Person>()))
                       .Callback<string, Person>((_, person) => capturedPerson = person)
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync("1", command);

        _domainServiceMock.Verify(d => d.EnsureUniqueAsync("Jane", "Doe", "1"), Times.Once);
        _repositoryMock.Verify(r => r.UpdateAsync("1", It.IsAny<Person>()), Times.Once);
        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Old@Pass1", capturedPerson!.Password);
        _passwordHashingServiceMock.Verify(service => service.HashPassword(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePersonAsyncPreservesExistingPassword()
    {
        var command  = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        var existing = new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Existing@Pass1" };
        var capturedPerson = (Person?)null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1"))
            .Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<Person>()))
                       .Callback<string, Person>((id, p) => capturedPerson = p)
                       .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync("1", command);

        Assert.NotNull(capturedPerson);
        Assert.Equal("hashed::Existing@Pass1", capturedPerson!.Password);
        _passwordHashingServiceMock.Verify(service => service.HashPassword(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePersonAsyncPersonNotFoundThrowsInvalidOperationException()
    {
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("missing"))
                       .ReturnsAsync((Person?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.UpdatePersonAsync("missing", command));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdatePersonAsyncEmptyOrWhitespaceIdThrowsInvalidOperationException(string id)
    {
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.UpdatePersonAsync(id, command));

        _repositoryMock.Verify(repository => repository.GetByIdAsync(It.IsAny<string>()), Times.Never);
        _repositoryMock.Verify(repository => repository.UpdateAsync(It.IsAny<string>(), It.IsAny<Person>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePersonAsyncNameTakenByAnotherPersonThrowsDuplicatePersonException()
    {
        var command  = new UpdatePersonCommand { FirstName = "Jane", LastName = "Smith" };
        var existing = new Person { Id = "1", FirstName = "John", LastName = "Doe" };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock
            .Setup(d => d.EnsureUniqueAsync("Jane", "Smith", "1"))
            .ThrowsAsync(new DuplicatePersonException("Jane", "Smith"));

        await Assert.ThrowsAsync<DuplicatePersonException>(
            () => _sut.UpdatePersonAsync("1", command));
    }

    [Fact]
    public async Task UpdatePersonAsyncManagedPersonUsesRequestedRoleForAuthorizationAndMapping()
    {
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe", Role = PersonRole.MANAGER };
        var existing = new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Old@Pass1", Role = PersonRole.USER };
        Person? updatedPerson = null;

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock.Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1")).Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<Person>()))
            .Callback<string, Person>((_, person) => updatedPerson = person)
            .Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync("1", command, "admin-1", PersonRole.ADMIN);

        Assert.NotNull(updatedPerson);
        Assert.Equal(PersonRole.MANAGER, updatedPerson!.Role);
        _domainServiceMock.Verify(d => d.EnsureCanUpdateManagedPerson(PersonRole.ADMIN, "admin-1", existing, PersonRole.MANAGER), Times.Once);
    }

    [Fact]
    public async Task UpdatePersonAsyncManagedPersonWithoutRoleUsesExistingRole()
    {
        var command = new UpdatePersonCommand { FirstName = "Jane", LastName = "Doe" };
        var existing = new Person { Id = "1", FirstName = "John", LastName = "Doe", Password = "hashed::Old@Pass1", Role = PersonRole.USER };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(existing);
        _domainServiceMock.Setup(d => d.EnsureUniqueAsync("Jane", "Doe", "1")).Returns(Task.CompletedTask);
        _repositoryMock.Setup(r => r.UpdateAsync("1", It.IsAny<Person>())).Returns(Task.CompletedTask);

        await _sut.UpdatePersonAsync("1", command, "manager-1", PersonRole.MANAGER);

        _domainServiceMock.Verify(d => d.EnsureCanUpdateManagedPerson(PersonRole.MANAGER, "manager-1", existing, PersonRole.USER), Times.Once);
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    [Fact]
    public async Task DeletePersonAsyncManagedPersonDeletesAfterAuthorization()
    {
        var command = new DeletePersonCommand { Id = "1" };
        var person = new Person { Id = "1", FirstName = "John", LastName = "Doe", Role = PersonRole.USER };

        _repositoryMock.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(person);
        _repositoryMock.Setup(r => r.DeleteAsync("1")).Returns(Task.CompletedTask);

        await _sut.DeletePersonAsync(command, "manager-1", PersonRole.MANAGER);

        _domainServiceMock.Verify(d => d.EnsureCanDeleteManagedPerson(PersonRole.MANAGER, person), Times.Once);
        _repositoryMock.Verify(r => r.DeleteAsync("1"), Times.Once);
    }

    [Fact]
    public async Task DeletePersonAsyncManagedPersonNotFoundThrowsInvalidOperationException()
    {
        var command = new DeletePersonCommand { Id = "missing" };

        _repositoryMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Person?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.DeletePersonAsync(command, "admin-1", PersonRole.ADMIN));
    }
}



