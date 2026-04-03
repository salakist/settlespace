using SettleSpace.Application.Transactions;
using SettleSpace.Domain.Debts.Entities;

namespace SettleSpace.Application.Debts
{
    public class DebtSummaryDto
    {
        public string CounterpartyPersonId { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal NetAmount { get; set; }
        public DebtDirection Direction { get; set; }
        public int TransactionCount { get; set; }
    }

    public class DebtDetailsDto : DebtSummaryDto
    {
        public decimal PaidByCurrentPerson { get; set; }
        public decimal PaidByCounterparty { get; set; }
        public List<TransactionDto> Transactions { get; set; } = [];
    }

    public class DebtSettlementResultDto
    {
        public string? SettlementTransactionId { get; set; }
        public string CounterpartyPersonId { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal SettledAmount { get; set; }
        public decimal RemainingNetAmount { get; set; }
        public DebtDirection Direction { get; set; }
    }
}
