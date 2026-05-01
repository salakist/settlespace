using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Transactions.Services;

public interface ITransactionApplicationService
{
    Task<List<TransactionDto>> SearchTransactionsAsync(string loggedPersonId, PersonRole loggedRole, TransactionSearchQuery query);
    Task<TransactionDto> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole);
    Task<TransactionDto> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command);
    Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command);
    Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole);
}
