using FoTestApi.Application.Commands;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Services
{
    public interface IPersonApplicationService
    {
        Task<List<PersonEntity>> GetAllPersonsAsync();
        Task<PersonEntity?> GetPersonByIdAsync(string id);
        Task<List<PersonEntity>> SearchPersonsAsync(string query);
        Task<PersonEntity> CreatePersonAsync(CreatePersonCommand command);
        Task UpdatePersonAsync(string id, UpdatePersonCommand command);
        Task DeletePersonAsync(DeletePersonCommand command);
    }
}
