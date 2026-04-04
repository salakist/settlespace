using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Transactions
{
    public record TransactionSearchFilter
    {
        public string? FreeText { get; init; }
        public List<TransactionStatus>? Status { get; init; }
    }
}
