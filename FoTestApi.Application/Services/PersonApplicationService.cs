using FoTestApi.Application.Commands;
using FoTestApi.Application.Mapping;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;

namespace FoTestApi.Application.Services
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
        private readonly IPersonMapper _personMapper;

        public PersonApplicationService(
            IPersonRepository repository,
            IPersonDomainService domainService,
            IPasswordHashingService passwordHashingService,
            IPasswordValidator passwordValidator,
            IPersonMapper personMapper)
        {
            _repository = repository;
            _domainService = domainService;
            _passwordHashingService = passwordHashingService;
            _passwordValidator = passwordValidator;
            _personMapper = personMapper;
        }

        // Queries

        public async Task<List<PersonEntity>> GetAllPersonsAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<PersonEntity?> GetPersonByIdAsync(string id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<List<PersonEntity>> SearchPersonsAsync(string query)
        {
            return await _repository.SearchAsync(query);
        }

        // Commands

        public async Task<PersonEntity> CreatePersonAsync(CreatePersonCommand command)
        {
            var password = string.IsNullOrWhiteSpace(command.Password)
                ? PasswordGenerator.GeneratePassword()
                : command.Password;

            var newPerson = _personMapper.ToEntity(command, password);

            newPerson.Validate();
            _passwordValidator.Validate(password);

            await _domainService.EnsureUniqueAsync(newPerson.FirstName, newPerson.LastName);

            newPerson.Password = _passwordHashingService.HashPassword(password);

            return await _repository.AddAsync(newPerson);
        }

        public async Task UpdatePersonAsync(string id, UpdatePersonCommand command)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new InvalidOperationException("Person ID is required for update.");
            }

            var existingPerson = await _repository.GetByIdAsync(id);
            if (existingPerson == null)
            {
                throw new InvalidOperationException($"Person with ID '{id}' not found.");
            }

            var updatedPerson = _personMapper.ToEntity(id, command, existingPerson.Password);

            updatedPerson.Validate();

            await _domainService.EnsureUniqueAsync(updatedPerson.FirstName, updatedPerson.LastName, id);

            await _repository.UpdateAsync(id, updatedPerson);
        }

        public async Task DeletePersonAsync(DeletePersonCommand command)
        {
            var person = await _repository.GetByIdAsync(command.Id);
            if (person == null)
            {
                throw new InvalidOperationException($"Person with ID '{command.Id}' not found.");
            }

            await _repository.DeleteAsync(command.Id);
        }
    }
}
