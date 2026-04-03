using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Debts.Entities
{
    public enum DebtDirection
    {
        TheyOweYou = 0,
        YouOweThem = 1,
        Settled = 2,
    }

    public class DebtSummary
    {
        public string CounterpartyPersonId { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal NetAmount { get; set; }
        public DebtDirection Direction { get; set; }
        public int TransactionCount { get; set; }
    }

    public class DebtDetails : DebtSummary
    {
        public decimal PaidByCurrentPerson { get; set; }
        public decimal PaidByCounterparty { get; set; }
        public List<Transaction> Transactions { get; set; } = [];
    }

    public class DebtSettlementResult
    {
        public string CounterpartyPersonId { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal SettledAmount { get; set; }
        public decimal RemainingNetAmount { get; set; }
        public DebtDirection Direction { get; set; }
        public Transaction SettlementTransaction { get; set; } = null!;
    }
}
