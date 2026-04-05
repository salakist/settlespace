using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Debts.Entities;

namespace SettleSpace.Application.Debts.Mapping
{
    public interface IDebtMapper
    {
        DebtSummaryDto ToSummaryDto(DebtSummary entity, IReadOnlyDictionary<string, string>? personDisplayNames = null);
        DebtDetailsDto ToDetailsDto(DebtDetails entity, IReadOnlyDictionary<string, string>? personDisplayNames = null);
        DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity, IReadOnlyDictionary<string, string>? personDisplayNames = null);
    }

    public class DebtMapper : IDebtMapper
    {
        private readonly ITransactionMapper _transactionMapper;

        public DebtMapper()
            : this(new TransactionMapper())
        {
        }

        public DebtMapper(ITransactionMapper transactionMapper)
        {
            _transactionMapper = transactionMapper;
        }

        public DebtSummaryDto ToSummaryDto(DebtSummary entity, IReadOnlyDictionary<string, string>? personDisplayNames = null) =>
            new()
            {
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CounterpartyDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.CounterpartyPersonId),
                CurrencyCode = entity.CurrencyCode,
                NetAmount = entity.NetAmount,
                Direction = entity.Direction,
                TransactionCount = entity.TransactionCount,
            };

        public DebtDetailsDto ToDetailsDto(DebtDetails entity, IReadOnlyDictionary<string, string>? personDisplayNames = null) =>
            new()
            {
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CounterpartyDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.CounterpartyPersonId),
                CurrencyCode = entity.CurrencyCode,
                NetAmount = entity.NetAmount,
                Direction = entity.Direction,
                TransactionCount = entity.TransactionCount,
                PaidByCurrentPerson = entity.PaidByCurrentPerson,
                PaidByCounterparty = entity.PaidByCounterparty,
                Transactions = entity.Transactions.Select(transaction => _transactionMapper.ToDto(transaction, personDisplayNames)).ToList(),
            };

        public DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity, IReadOnlyDictionary<string, string>? personDisplayNames = null) =>
            new()
            {
                SettlementTransactionId = entity.SettlementTransaction.Id,
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CounterpartyDisplayName = ResolvePersonDisplayName(personDisplayNames, entity.CounterpartyPersonId),
                CurrencyCode = entity.CurrencyCode,
                SettledAmount = entity.SettledAmount,
                RemainingNetAmount = entity.RemainingNetAmount,
                Direction = entity.Direction,
            };

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
