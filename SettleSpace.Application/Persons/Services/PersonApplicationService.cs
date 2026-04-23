using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.Mapping;
using SettleSpace.Application.Persons.Queries;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Services;

namespace SettleSpace.Application.Persons.Services;

/// <summary>
/// Application service for handling person-related commands and queries.
/// Orchestrates domain logic and repository operations.
/// Uniqueness rules are enforced by <see cref="PersonDomainService"/>.
/// </summary>
public class PersonApplicationService(
    IPersonRepository repository,
    IPersonDomainService domainService,
    IPasswordHashingService passwordHashingService,
    IPasswordValidator passwordValidator,
    IPasswordGenerator passwordGenerator,
    IPersonMapper personMapper) : IPersonApplicationService
{
    // Queries

    public async Task<List<Person>> GetPersonsAsync(string loggedPersonId, PersonRole loggedRole)
    {
        domainService.EnsureCanAccessDirectory(loggedRole);
        return await repository.GetAllAsync();
    }

    public async Task<List<Person>> SearchPersonsAsync(string query, string loggedPersonId, PersonRole loggedRole)
    {
        domainService.EnsureCanAccessDirectory(loggedRole);
        return await repository.SearchAsync(query);
    }

    public async Task<List<Person>> SearchPersonsAsync(string loggedPersonId, PersonRole loggedRole, PersonSearchQuery query)
    {
        domainService.EnsureCanAccessDirectory(loggedRole);
        var filter = personMapper.ToSearchFilter(query);
        filter.Validate();
        return await repository.SearchAsync(filter);
    }

    public async Task<Person?> GetPersonByIdAsync(string id)
    {
        return await repository.GetByIdAsync(id);
    }

    public async Task<Person?> GetPersonByIdAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        domainService.EnsureCanAccessDirectory(loggedRole);
        return await repository.GetByIdAsync(id);
    }

    // Commands

    public async Task<Person> CreatePersonAsync(CreatePersonCommand command)
    {
        var role = await ResolveBootstrapAwareCreationRoleAsync(command.Role);
        return await CreatePersonCoreAsync(command, role);
    }

    public async Task<Person> CreatePersonAsync(CreatePersonCommand command, string loggedPersonId, PersonRole loggedRole)
    {
        var role = command.Role ?? PersonRole.USER;
        domainService.EnsureCanCreateManagedPerson(loggedRole, role);
        return await CreatePersonCoreAsync(command, role);
    }

    public async Task UpdatePersonAsync(string id, UpdatePersonCommand command)
    {
        await UpdatePersonCoreAsync(
            id,
            command,
            (existingPerson, requestedRole) => domainService.EnsureCanUpdateSelf(existingPerson, requestedRole));
    }

    public async Task UpdatePersonAsync(string id, UpdatePersonCommand command, string loggedPersonId, PersonRole loggedRole)
    {
        await UpdatePersonCoreAsync(
            id,
            command,
            (existingPerson, requestedRole) => domainService.EnsureCanUpdateManagedPerson(loggedRole, loggedPersonId, existingPerson, requestedRole));
    }

    public async Task DeletePersonAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var person = await repository.GetByIdAsync(id) ?? throw new PersonNotFoundException(id);
        domainService.EnsureCanDeleteManagedPerson(loggedRole, person);

        await repository.DeleteAsync(id);
    }

    private async Task<PersonRole> ResolveBootstrapAwareCreationRoleAsync(PersonRole? requestedRole)
    {
        if (requestedRole.HasValue)
        {
            return requestedRole.Value;
        }

        var existingPersons = await repository.GetAllAsync() ?? [];
        return existingPersons.Count == 0 ? PersonRole.ADMIN : PersonRole.USER;
    }

    private async Task<Person> CreatePersonCoreAsync(CreatePersonCommand command, PersonRole role)
    {
        var password = string.IsNullOrWhiteSpace(command.Password)
            ? passwordGenerator.GeneratePassword()
            : command.Password;

        var newPerson = personMapper.ToEntity(command, password, role);

        newPerson.Validate();
        passwordValidator.Validate(password);

        await domainService.EnsureUniqueAsync(newPerson.FirstName, newPerson.LastName);

        newPerson.Password = passwordHashingService.HashPassword(password);

        return await repository.AddAsync(newPerson);
    }

    private async Task UpdatePersonCoreAsync(
        string id,
        UpdatePersonCommand command,
        Action<Person, PersonRole> ensureAuthorized)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new InvalidPersonException("Person ID is required for update.");
        }

        var existingPerson = await repository.GetByIdAsync(id) ?? throw new PersonNotFoundException(id);
        var requestedRole = command.Role ?? existingPerson.Role;
        ensureAuthorized(existingPerson, requestedRole);

        var updatedPerson = personMapper.ToEntity(id, command, existingPerson.Password, requestedRole);
        updatedPerson.Validate();

        await domainService.EnsureUniqueAsync(updatedPerson.FirstName, updatedPerson.LastName, id);

        await repository.UpdateAsync(id, updatedPerson);
    }
}
