using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions.Mapping
{
    public interface ITransactionMapper
    {
        TransactionDto ToDto(Transaction entity, IReadOnlyDictionary<string, string>? personDisplayNames = null);
        TransactionSearchFilter ToSearchFilter(TransactionSearchQuery query);
        TransactionSearchPolicy ToSearchPolicy(TransactionSearchQuery query);
        Transaction ToEntity(CreateTransactionCommand command, string createdByPersonId);
        Transaction ToEntity(string id, UpdateTransactionCommand command, string createdByPersonId, DateTime createdAtUtc);
    }
}
