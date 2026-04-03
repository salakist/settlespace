using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Debts.Entities;

namespace SettleSpace.Application.Debts.Mapping
{
    public interface IDebtMapper
    {
        DebtSummaryDto ToSummaryDto(DebtSummary entity);
        DebtDetailsDto ToDetailsDto(DebtDetails entity);
        DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity);
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

        public DebtSummaryDto ToSummaryDto(DebtSummary entity) =>
            new()
            {
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CurrencyCode = entity.CurrencyCode,
                NetAmount = entity.NetAmount,
                Direction = entity.Direction,
                TransactionCount = entity.TransactionCount,
            };

        public DebtDetailsDto ToDetailsDto(DebtDetails entity) =>
            new()
            {
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CurrencyCode = entity.CurrencyCode,
                NetAmount = entity.NetAmount,
                Direction = entity.Direction,
                TransactionCount = entity.TransactionCount,
                PaidByCurrentPerson = entity.PaidByCurrentPerson,
                PaidByCounterparty = entity.PaidByCounterparty,
                Transactions = entity.Transactions.Select(_transactionMapper.ToDto).ToList(),
            };

        public DebtSettlementResultDto ToSettlementResultDto(DebtSettlementResult entity) =>
            new()
            {
                SettlementTransactionId = entity.SettlementTransaction.Id,
                CounterpartyPersonId = entity.CounterpartyPersonId,
                CurrencyCode = entity.CurrencyCode,
                SettledAmount = entity.SettledAmount,
                RemainingNetAmount = entity.RemainingNetAmount,
                Direction = entity.Direction,
            };
    }
}
