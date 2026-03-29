using FoTestApi.Application.Commands;
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
        private readonly PersonDomainService _domainService;

        public PersonApplicationService(IPersonRepository repository, PersonDomainService domainService)
        {
            _repository = repository;
            _domainService = domainService;
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
            // Validate domain entity
            var newPerson = new PersonEntity
            {
                FirstName = command.FirstName,
                LastName = command.LastName
            };

            newPerson.Validate();

            // Delegate uniqueness rule to Domain Service
            await _domainService.EnsureUniqueAsync(newPerson.FirstName, newPerson.LastName);

            // Persist to repository
            return await _repository.AddAsync(newPerson);
        }

        public async Task UpdatePersonAsync(UpdatePersonCommand command)
        {
            // Retrieve existing person
            var existingPerson = await _repository.GetByIdAsync(command.Id);
            if (existingPerson == null)
            {
                throw new InvalidOperationException($"Person with ID '{command.Id}' not found.");
            }

            // Create updated entity
            var updatedPerson = new PersonEntity
            {
                Id = command.Id,
                FirstName = command.FirstName,
                LastName = command.LastName
            };

            updatedPerson.Validate();

            // Delegate uniqueness rule to Domain Service (excluding current person)
            await _domainService.EnsureUniqueAsync(updatedPerson.FirstName, updatedPerson.LastName, command.Id);

            // Persist update
            await _repository.UpdateAsync(command.Id, updatedPerson);
        }

        public async Task DeletePersonAsync(DeletePersonCommand command)
        {
            // Retrieve and verify person exists
            var person = await _repository.GetByIdAsync(command.Id);
            if (person == null)
            {
                throw new InvalidOperationException($"Person with ID '{command.Id}' not found.");
            }

            // Delete from repository
            await _repository.DeleteAsync(command.Id);
        }
    }
}
