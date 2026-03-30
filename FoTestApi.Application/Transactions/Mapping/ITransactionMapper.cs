using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Application.Transactions;
using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Application.Transactions.Mapping
{
    public interface ITransactionMapper
    {
        TransactionDto ToDto(Transaction entity);
        Transaction ToEntity(CreateTransactionCommand command, string createdByPersonId);
        Transaction ToEntity(string id, UpdateTransactionCommand command, string createdByPersonId, DateTime createdAtUtc);
    }
}



