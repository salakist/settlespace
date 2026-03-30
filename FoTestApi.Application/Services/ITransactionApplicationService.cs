using FoTestApi.Application.Commands;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Services
{
    public interface ITransactionApplicationService
    {
        Task<List<TransactionEntity>> GetCurrentUserTransactionsAsync(string loggedPersonId);
        Task<List<TransactionEntity>> SearchCurrentUserTransactionsAsync(string loggedPersonId, string query);
        Task<TransactionEntity> GetTransactionByIdAsync(string id, string loggedPersonId);
        Task<TransactionEntity> CreateTransactionAsync(string loggedPersonId, CreateTransactionCommand command);
        Task UpdateTransactionAsync(string id, string loggedPersonId, UpdateTransactionCommand command);
        Task DeleteTransactionAsync(string id, string loggedPersonId);
    }
}
