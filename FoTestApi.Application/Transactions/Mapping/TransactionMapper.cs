using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Application.Transactions.Mapping
{
    public class TransactionMapper : ITransactionMapper
    {
        public TransactionDto ToDto(Transaction entity) =>
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

        public Transaction ToEntity(CreateTransactionCommand command, string createdByPersonId)
        {
            var utcNow = DateTime.UtcNow;
            return BuildTransaction(command, null, createdByPersonId, utcNow, utcNow);
        }

        public Transaction ToEntity(
            string id,
            UpdateTransactionCommand command,
            string createdByPersonId,
            DateTime createdAtUtc)
        {
            return BuildTransaction(command, id, createdByPersonId, createdAtUtc, DateTime.UtcNow);
        }

        private static Transaction BuildTransaction(
            TransactionMutationCommand command,
            string? id,
            string createdByPersonId,
            DateTime createdAtUtc,
            DateTime updatedAtUtc)
        {
            return new Transaction
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



