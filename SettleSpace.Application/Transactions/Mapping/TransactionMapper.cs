using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions.Mapping;

public class TransactionMapper : ITransactionMapper
{
    public TransactionDto ToDto(Transaction entity, IReadOnlyDictionary<string, string> personDisplayNames) =>
        new()
        {
            Id = entity.Id,
            PayerPersonId = entity.PayerPersonId,
            PayerDisplayName = personDisplayNames.GetValueOrDefault(entity.PayerPersonId, entity.PayerPersonId),
            PayeePersonId = entity.PayeePersonId,
            PayeeDisplayName = personDisplayNames.GetValueOrDefault(entity.PayeePersonId, entity.PayeePersonId),
            CreatedByPersonId = entity.CreatedByPersonId,
            CreatedByDisplayName = personDisplayNames.GetValueOrDefault(entity.CreatedByPersonId, entity.CreatedByPersonId),
            Amount = entity.Amount,
            CurrencyCode = entity.CurrencyCode,
            TransactionDateUtc = entity.TransactionDateUtc,
            Description = entity.Description,
            Category = entity.Category,
            Status = entity.Status,
            ConfirmedByPersonIds = entity.ConfirmedByPersonIds,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc,
        };

    public TransactionSearchFilter ToSearchFilter(TransactionSearchQuery query, string loggedPersonId)
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
            Involvement = query.Involvement,
            InvolvementPersonId = loggedPersonId,
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
            Status = command.Status ?? TransactionStatus.Pending,
            CreatedAtUtc = createdAtUtc,
            UpdatedAtUtc = updatedAtUtc,
        };
    }
}
