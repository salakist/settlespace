using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Application.Transactions.Services
{
    public interface ITransactionApplicationService
    {
        Task<List<Transaction>> GetCurrentUserTransactionsAsync(string loggedPersonId, PersonRole loggedRole);
        Task<List<Transaction>> SearchCurrentUserTransactionsAsync(string loggedPersonId, PersonRole loggedRole, string query);
        Task<Transaction> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole);
        Task<Transaction> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command);
        Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command);
        Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole);
    }
}



