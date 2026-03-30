using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Mapping
{
    public interface ITransactionMapper
    {
        TransactionDto ToDto(TransactionEntity entity);
        TransactionEntity ToEntity(CreateTransactionCommand command, string createdByPersonId);
        TransactionEntity ToEntity(string id, UpdateTransactionCommand command, string createdByPersonId, DateTime createdAtUtc);
    }
}
