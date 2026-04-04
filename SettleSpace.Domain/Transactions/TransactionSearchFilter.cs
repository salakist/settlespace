namespace SettleSpace.Domain.Transactions
{
    public record TransactionSearchFilter
    {
        public string? FreeText { get; init; }
    }
}
