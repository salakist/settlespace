using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.Mapping;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Services;

namespace SettleSpace.Application.Persons.Services
{
    /// <summary>
    /// Application service for handling person-related commands and queries.
    /// Orchestrates domain logic and repository operations.
    /// Uniqueness rules are enforced by <see cref="PersonDomainService"/>.
    /// </summary>
    public class PersonApplicationService : IPersonApplicationService
    {
        private readonly IPersonRepository _repository;
        private readonly IPersonDomainService _domainService;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IPasswordValidator _passwordValidator;
        private readonly IPasswordGenerator _passwordGenerator;
        private readonly IPersonMapper _personMapper;

        public PersonApplicationService(
            IPersonRepository repository,
            IPersonDomainService domainService,
            IPasswordHashingService passwordHashingService,
            IPasswordValidator passwordValidator,
            IPasswordGenerator passwordGenerator,
            IPersonMapper personMapper)
        {
            _repository = repository;
            _domainService = domainService;
            _passwordHashingService = passwordHashingService;
            _passwordValidator = passwordValidator;
            _passwordGenerator = passwordGenerator;
            _personMapper = personMapper;
        }

        // Queries

        public async Task<List<Person>> GetPersonsAsync(string loggedPersonId, PersonRole loggedRole)
        {
            _domainService.EnsureCanAccessDirectory(loggedRole);
            return await _repository.GetAllAsync();
        }

        public async Task<List<Person>> SearchPersonsAsync(string query, string loggedPersonId, PersonRole loggedRole)
        {
            _domainService.EnsureCanAccessDirectory(loggedRole);
            return await _repository.SearchAsync(query);
        }

        public async Task<Person?> GetPersonByIdAsync(string id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<Person?> GetPersonByIdAsync(string id, string loggedPersonId, PersonRole loggedRole)
        {
            _domainService.EnsureCanAccessDirectory(loggedRole);
            return await _repository.GetByIdAsync(id);
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
            _domainService.EnsureCanCreateManagedPerson(loggedRole, role);
            return await CreatePersonCoreAsync(command, role);
        }

        public async Task UpdatePersonAsync(string id, UpdatePersonCommand command)
        {
            await UpdatePersonCoreAsync(
                id,
                command,
                (existingPerson, requestedRole) => _domainService.EnsureCanUpdateSelf(existingPerson, requestedRole));
        }

        public async Task UpdatePersonAsync(string id, UpdatePersonCommand command, string loggedPersonId, PersonRole loggedRole)
        {
            await UpdatePersonCoreAsync(
                id,
                command,
                (existingPerson, requestedRole) => _domainService.EnsureCanUpdateManagedPerson(loggedRole, loggedPersonId, existingPerson, requestedRole));
        }

        public async Task DeletePersonAsync(string id, string loggedPersonId, PersonRole loggedRole)
        {
            var person = await _repository.GetByIdAsync(id);
            if (person == null)
            {
                throw new PersonNotFoundException(id);
            }

            _domainService.EnsureCanDeleteManagedPerson(loggedRole, person);

            await _repository.DeleteAsync(id);
        }

        private async Task<PersonRole> ResolveBootstrapAwareCreationRoleAsync(PersonRole? requestedRole)
        {
            if (requestedRole.HasValue)
            {
                return requestedRole.Value;
            }

            var existingPersons = await _repository.GetAllAsync() ?? [];
            return existingPersons.Count == 0 ? PersonRole.ADMIN : PersonRole.USER;
        }

        private async Task<Person> CreatePersonCoreAsync(CreatePersonCommand command, PersonRole role)
        {
            var password = string.IsNullOrWhiteSpace(command.Password)
                ? _passwordGenerator.GeneratePassword()
                : command.Password;

            var newPerson = _personMapper.ToEntity(command, password, role);

            newPerson.Validate();
            _passwordValidator.Validate(password);

            await _domainService.EnsureUniqueAsync(newPerson.FirstName, newPerson.LastName);

            newPerson.Password = _passwordHashingService.HashPassword(password);

            return await _repository.AddAsync(newPerson);
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

            var existingPerson = await _repository.GetByIdAsync(id);
            if (existingPerson == null)
            {
                throw new PersonNotFoundException(id);
            }

            var requestedRole = command.Role ?? existingPerson.Role;
            ensureAuthorized(existingPerson, requestedRole);

            var updatedPerson = _personMapper.ToEntity(id, command, existingPerson.Password, requestedRole);
            updatedPerson.Validate();

            await _domainService.EnsureUniqueAsync(updatedPerson.FirstName, updatedPerson.LastName, id);

            await _repository.UpdateAsync(id, updatedPerson);
        }
    }
}



