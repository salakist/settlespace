using FoTestApi.Application.Persons.Commands;
using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Application.Persons.Services
{
    public interface IPersonApplicationService
    {
        Task<List<Person>> GetAllPersonsAsync();
        Task<Person?> GetPersonByIdAsync(string id);
        Task<List<Person>> SearchPersonsAsync(string query);
        Task<Person> CreatePersonAsync(CreatePersonCommand command);
        Task UpdatePersonAsync(string id, UpdatePersonCommand command);
        Task DeletePersonAsync(DeletePersonCommand command);
    }
}



