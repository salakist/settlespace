namespace SettleSpace.Domain.Transactions.Entities
{
    public enum TransactionStatus
    {
        Pending = 0,
        Completed = 1,
        Cancelled = 2
    }

    public static class TransactionStatusCatalog
    {
        public static IReadOnlyList<TransactionStatus> All() =>
        [
            TransactionStatus.Pending,
            TransactionStatus.Completed,
            TransactionStatus.Cancelled,
        ];
    }
}

