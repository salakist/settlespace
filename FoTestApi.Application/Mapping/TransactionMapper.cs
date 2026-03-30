using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Mapping
{
    public class TransactionMapper : ITransactionMapper
    {
        public TransactionDto ToDto(TransactionEntity entity) =>
            new()
            {
                Id = entity.Id,
                PayerPersonId = entity.PayerPersonId,
                PayeePersonId = entity.PayeePersonId,
                CreatedByPersonId = entity.CreatedByPersonId,
                Amount = entity.Amount,
                CurrencyCode = entity.CurrencyCode,
                TransactionDateUtc = entity.TransactionDateUtc,
                Description = entity.Description,
                Category = entity.Category,
                Status = entity.Status,
                CreatedAtUtc = entity.CreatedAtUtc,
                UpdatedAtUtc = entity.UpdatedAtUtc,
            };

        public TransactionEntity ToEntity(CreateTransactionCommand command, string createdByPersonId)
        {
            var utcNow = DateTime.UtcNow;
            return BuildTransactionEntity(command, null, createdByPersonId, utcNow, utcNow);
        }

        public TransactionEntity ToEntity(
            string id,
            UpdateTransactionCommand command,
            string createdByPersonId,
            DateTime createdAtUtc)
        {
            return BuildTransactionEntity(command, id, createdByPersonId, createdAtUtc, DateTime.UtcNow);
        }

        private static TransactionEntity BuildTransactionEntity(
            TransactionMutationCommand command,
            string? id,
            string createdByPersonId,
            DateTime createdAtUtc,
            DateTime updatedAtUtc)
        {
            return new TransactionEntity
            {
                Id = id,
                PayerPersonId = command.PayerPersonId,
                PayeePersonId = command.PayeePersonId,
                CreatedByPersonId = createdByPersonId,
                Amount = command.Amount,
                CurrencyCode = command.CurrencyCode.Trim().ToUpperInvariant(),
                TransactionDateUtc = command.TransactionDateUtc,
                Description = command.Description,
                Category = command.Category,
                Status = command.Status,
                CreatedAtUtc = createdAtUtc,
                UpdatedAtUtc = updatedAtUtc,
            };
        }
    }
}
