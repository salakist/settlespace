using FoTestApi.Application.Commands;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;

namespace FoTestApi.Application
{
    /// <summary>
    /// Application service for handling person-related commands and queries.
    /// Orchestrates domain logic and repository operations.
    /// </summary>
    public class PersonApplicationService
    {
        private readonly IPersonRepository _repository;

        public PersonApplicationService(IPersonRepository repository)
        {
            _repository = repository;
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

            // Check for duplicates
            var existingPerson = await _repository.FindByFullNameAsync(newPerson.FirstName, newPerson.LastName);
            if (existingPerson != null)
            {
                throw new DuplicatePersonException(newPerson.FirstName, newPerson.LastName);
            }

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

            // Check for duplicates (excluding current person)
            var duplicatePerson = await _repository.FindByFullNameAsync(updatedPerson.FirstName, updatedPerson.LastName);
            if (duplicatePerson != null && duplicatePerson.Id != command.Id)
            {
                throw new DuplicatePersonException(updatedPerson.FirstName, updatedPerson.LastName);
            }

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
