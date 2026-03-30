using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Application.Transactions.Services
{
    public interface ITransactionApplicationService
    {
        Task<List<Transaction>> GetCurrentUserTransactionsAsync(string loggedPersonId);
        Task<List<Transaction>> SearchCurrentUserTransactionsAsync(string loggedPersonId, string query);
        Task<Transaction> GetTransactionByIdAsync(string id, string loggedPersonId);
        Task<Transaction> CreateTransactionAsync(string loggedPersonId, CreateTransactionCommand command);
        Task UpdateTransactionAsync(string id, string loggedPersonId, UpdateTransactionCommand command);
        Task DeleteTransactionAsync(string id, string loggedPersonId);
    }
}



