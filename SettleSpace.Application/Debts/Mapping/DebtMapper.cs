using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Debts.Entities;

namespace SettleSpace.Application.Debts.Mapping;

public interface IDebtMapper
{
    DebtSummaryDto ToSummaryDto(DebtSummary entity, IReadOnlyDictionary<string, string> personDisplayNames);
    DebtDetailsDto ToDetailsDto(DebtDetails entity, IReadOnlyDictionary<string, string> personDisplayNames);
    DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity, IReadOnlyDictionary<string, string> personDisplayNames);
}

public class DebtMapper(ITransactionMapper transactionMapper) : IDebtMapper
{
    public DebtSummaryDto ToSummaryDto(DebtSummary entity, IReadOnlyDictionary<string, string> personDisplayNames) =>
        new()
        {
            CounterpartyPersonId = entity.CounterpartyPersonId,
            CounterpartyDisplayName = personDisplayNames.GetValueOrDefault(entity.CounterpartyPersonId, entity.CounterpartyPersonId),
            CurrencyCode = entity.CurrencyCode,
            NetAmount = entity.NetAmount,
            Direction = entity.Direction,
            TransactionCount = entity.TransactionCount,
        };

    public DebtDetailsDto ToDetailsDto(DebtDetails entity, IReadOnlyDictionary<string, string> personDisplayNames) =>
        new()
        {
            CounterpartyPersonId = entity.CounterpartyPersonId,
            CounterpartyDisplayName = personDisplayNames.GetValueOrDefault(entity.CounterpartyPersonId, entity.CounterpartyPersonId),
            CurrencyCode = entity.CurrencyCode,
            NetAmount = entity.NetAmount,
            Direction = entity.Direction,
            TransactionCount = entity.TransactionCount,
            PaidByCurrentPerson = entity.PaidByCurrentPerson,
            PaidByCounterparty = entity.PaidByCounterparty,
            Transactions = [.. entity.Transactions.Select(transaction => transactionMapper.ToDto(transaction, personDisplayNames))],
        };

    public DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity, IReadOnlyDictionary<string, string> personDisplayNames) =>
        new()
        {
            SettlementTransactionId = entity.SettlementTransaction.Id,
            CounterpartyPersonId = entity.CounterpartyPersonId,
            CounterpartyDisplayName = personDisplayNames.GetValueOrDefault(entity.CounterpartyPersonId, entity.CounterpartyPersonId),
            CurrencyCode = entity.CurrencyCode,
            SettledAmount = entity.SettledAmount,
            RemainingNetAmount = entity.RemainingNetAmount,
            Direction = entity.Direction,
        };
}
