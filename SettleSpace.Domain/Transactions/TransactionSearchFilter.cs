using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Transactions
{
    public record TransactionSearchFilter
    {
        public string? FreeText { get; init; }
        public List<TransactionStatus>? Status { get; init; }
        public string? Category { get; init; }
        public string? Description { get; init; }
    }
}
