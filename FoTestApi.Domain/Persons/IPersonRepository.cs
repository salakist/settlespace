using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Domain.Persons
{
    /// <summary>
    /// Repository interface for Person aggregate root.
    /// Defines all data access operations for persons.
    /// </summary>
    public interface IPersonRepository
    {
        /// <summary>
        /// Retrieves all persons from the repository.
        /// </summary>
        Task<List<Person>> GetAllAsync();

        /// <summary>
        /// Retrieves a person by their unique identifier.
        /// </summary>
        /// <param name="id">The person's ID.</param>
        /// <returns>The person if found; otherwise null.</returns>
        Task<Person?> GetByIdAsync(string id);

        /// <summary>
        /// Searches for persons by a query string (case-insensitive, substring match on firstName or lastName).
        /// </summary>
        /// <param name="query">The search query.</param>
        /// <returns>A list of matching persons.</returns>
        Task<List<Person>> SearchAsync(string query);

        /// <summary>
        /// Finds a person by case-insensitive full name match.
        /// </summary>
        /// <param name="firstName">The first name to search for.</param>
        /// <param name="lastName">The last name to search for.</param>
        /// <returns>The person if found; otherwise null.</returns>
        Task<Person?> FindByFullNameAsync(string firstName, string lastName);

        /// <summary>
        /// Adds a new person to the repository.
        /// </summary>
        /// <param name="person">The person entity to add.</param>
        /// <returns>The added person with assigned ID.</returns>
        Task<Person> AddAsync(Person person);

        /// <summary>
        /// Updates an existing person in the repository.
        /// </summary>
        /// <param name="id">The ID of the person to update.</param>
        /// <param name="person">The updated person entity.</param>
        Task UpdateAsync(string id, Person person);

        /// <summary>
        /// Removes a person from the repository by their ID.
        /// </summary>
        /// <param name="id">The ID of the person to remove.</param>
        Task DeleteAsync(string id);
    }
}


