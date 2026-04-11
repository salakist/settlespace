using SettleSpace.Application.Persons.Commands;
using SettleSpace.Application.Persons.Queries;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Persons.Services;

public interface IPersonApplicationService
{
    Task<List<Person>> GetPersonsAsync(string loggedPersonId, PersonRole loggedRole);
    Task<List<Person>> SearchPersonsAsync(string query, string loggedPersonId, PersonRole loggedRole);
    Task<List<Person>> SearchPersonsAsync(string loggedPersonId, PersonRole loggedRole, PersonSearchQuery query);
    Task<Person?> GetPersonByIdAsync(string id);
    Task<Person?> GetPersonByIdAsync(string id, string loggedPersonId, PersonRole loggedRole);
    Task<Person> CreatePersonAsync(CreatePersonCommand command);
    Task<Person> CreatePersonAsync(CreatePersonCommand command, string loggedPersonId, PersonRole loggedRole);
    Task UpdatePersonAsync(string id, UpdatePersonCommand command);
    Task UpdatePersonAsync(string id, UpdatePersonCommand command, string loggedPersonId, PersonRole loggedRole);
    Task DeletePersonAsync(string id, string loggedPersonId, PersonRole loggedRole);
}
