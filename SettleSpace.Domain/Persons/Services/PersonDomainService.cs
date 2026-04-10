using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Persons.Services;

/// <summary>
/// Domain service enforcing uniqueness invariants for the Person aggregate.
/// This service owns the business rule: no two persons may share the same
/// first name and last name (case-insensitive).
/// </summary>
public class PersonDomainService(IPersonRepository repository) : IPersonDomainService
{
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
        var existing = await repository.FindByFullNameAsync(firstName, lastName);

        if (existing != null && existing.Id != excludeId)
        {
            throw new DuplicatePersonException(firstName, lastName);
        }
    }

    public void EnsureCanAccessDirectory(PersonRole loggedRole)
    {
        _ = loggedRole;
    }

    public void EnsureCanCreateManagedPerson(PersonRole loggedRole, PersonRole targetRole)
    {
        if (!loggedRole.IsStaffRole())
        {
            throw new UnauthorizedPersonAccessException("Users cannot create persons.");
        }

        if (loggedRole == PersonRole.MANAGER && targetRole != PersonRole.USER)
        {
            throw new UnauthorizedPersonAccessException("Managers can only create users.");
        }
    }

    public void EnsureCanUpdateManagedPerson(PersonRole loggedRole, string loggedPersonId, Person existingPerson, PersonRole requestedRole)
    {
        if (loggedRole == PersonRole.USER)
        {
            throw new UnauthorizedPersonAccessException("Users cannot update persons.");
        }

        if (string.Equals(existingPerson.Id, loggedPersonId, StringComparison.Ordinal) && existingPerson.Role != requestedRole)
        {
            throw new UnauthorizedPersonAccessException("You cannot change your own role.");
        }

        if (loggedRole == PersonRole.MANAGER)
        {
            if (existingPerson.Role != PersonRole.USER)
            {
                throw new UnauthorizedPersonAccessException("Managers can only update users.");
            }

            if (existingPerson.Role != requestedRole)
            {
                throw new UnauthorizedPersonAccessException("Managers cannot change person roles.");
            }
        }
    }

    public void EnsureCanDeleteManagedPerson(PersonRole loggedRole, Person existingPerson)
    {
        if (loggedRole == PersonRole.USER)
        {
            throw new UnauthorizedPersonAccessException("Users cannot delete persons.");
        }

        if (loggedRole == PersonRole.MANAGER && existingPerson.Role != PersonRole.USER)
        {
            throw new UnauthorizedPersonAccessException("Managers can only delete users.");
        }
    }

    public void EnsureCanUpdateSelf(Person existingPerson, PersonRole requestedRole)
    {
        if (existingPerson.Role != requestedRole)
        {
            throw new UnauthorizedPersonAccessException("You cannot change your own role.");
        }
    }
}
