using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions.Services
{
    public interface ITransactionApplicationService
    {
        Task<List<Transaction>> SearchTransactionsAsync(string loggedPersonId, PersonRole loggedRole, TransactionSearchQuery query);
        Task<Transaction> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole);
        Task<Transaction> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command);
        Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command);
        Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole);
    }
}



