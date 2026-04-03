using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions.Mapping
{
    public interface ITransactionMapper
    {
        TransactionDto ToDto(Transaction entity);
        Transaction ToEntity(CreateTransactionCommand command, string createdByPersonId);
        Transaction ToEntity(string id, UpdateTransactionCommand command, string createdByPersonId, DateTime createdAtUtc);
    }
}



