using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions.Mapping
{
    public class TransactionMapper : ITransactionMapper
    {
        public TransactionDto ToDto(Transaction entity, IReadOnlyDictionary<string, string>? personDisplayNames = null) =>
            new()
            {
                Id = entity.Id,
                PayerPersonId = entity.PayerPersonId,
                PayerDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.PayerPersonId),
                PayeePersonId = entity.PayeePersonId,
                PayeeDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.PayeePersonId),
                CreatedByPersonId = entity.CreatedByPersonId,
                CreatedByDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.CreatedByPersonId),
                Amount = entity.Amount,
                CurrencyCode = entity.CurrencyCode,
                TransactionDateUtc = entity.TransactionDateUtc,
                Description = entity.Description,
                Category = entity.Category,
                Status = entity.Status,
                CreatedAtUtc = entity.CreatedAtUtc,
                UpdatedAtUtc = entity.UpdatedAtUtc,
            };

        public TransactionSearchFilter ToSearchFilter(TransactionSearchQuery query)
        {
            var freeText = query.FreeText?.Trim();

            return new TransactionSearchFilter
            {
                FreeText = freeText,
                Status = query.Status,
                Category = query.Category,
                Description = query.Description,
                Involved = query.Involved,
                ManagedBy = query.ManagedBy,
                Payer = query.Payer,
                Payee = query.Payee,
            };
        }

        public TransactionSearchPolicy ToSearchPolicy(TransactionSearchQuery query)
        {
            return new TransactionSearchPolicy
            {
                ManagedBy = query.ManagedBy,
                Involvement = query.Involvement,
            };
        }

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

        private static string ResolvePersonDisplayName(
            IReadOnlyDictionary<string, string>? personDisplayNames,
            string personId)
        {
            if (personDisplayNames != null
                && personDisplayNames.TryGetValue(personId, out var displayName)
                && !string.IsNullOrWhiteSpace(displayName))
            {
                return displayName;
            }

            return personId;
        }
    }
}



