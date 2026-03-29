using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;

namespace FoTestApi.Domain.Services
{
    /// <summary>
    /// Domain service enforcing uniqueness invariants for the Person aggregate.
    /// This service owns the business rule: no two persons may share the same
    /// first name and last name (case-insensitive).
    /// </summary>
    public class PersonDomainService
    {
        private readonly IPersonRepository _repository;

        public PersonDomainService(IPersonRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Ensures that no other person with the same full name (case-insensitive) exists.
        /// </summary>
        /// <param name="firstName">First name to check.</param>
        /// <param name="lastName">Last name to check.</param>
        /// <param name="excludeId">
        /// When updating, pass the ID of the person being updated so it is
        /// excluded from the duplicate check.
        /// </param>
        /// <exception cref="DuplicatePersonException">
        /// Thrown when a conflicting person already exists.
        /// </exception>
        public async Task EnsureUniqueAsync(string firstName, string lastName, string? excludeId = null)
        {
            var existing = await _repository.FindByFullNameAsync(firstName, lastName);

            if (existing != null && existing.Id != excludeId)
            {
                throw new DuplicatePersonException(firstName, lastName);
            }
        }
    }
}
