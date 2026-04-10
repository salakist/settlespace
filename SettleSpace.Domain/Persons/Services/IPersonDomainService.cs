using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Domain.Persons.Services;

public interface IPersonDomainService
{
    Task EnsureUniqueAsync(string firstName, string lastName, string? excludeId = null);
    void EnsureCanAccessDirectory(PersonRole loggedRole);
    void EnsureCanCreateManagedPerson(PersonRole loggedRole, PersonRole targetRole);
    void EnsureCanUpdateManagedPerson(PersonRole loggedRole, string loggedPersonId, Person existingPerson, PersonRole requestedRole);
    void EnsureCanDeleteManagedPerson(PersonRole loggedRole, Person existingPerson);
    void EnsureCanUpdateSelf(Person existingPerson, PersonRole requestedRole);
}
