using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Application.Transactions.Queries
{
    public class TransactionSearchQuery
    {
        public string? FreeText { get; set; }

        public void Validate()
        {
            if (FreeText is not null && string.IsNullOrWhiteSpace(FreeText))
            {
                throw new InvalidTransactionSearchException("FreeText must not be empty or whitespace when provided.");
            }
        }
    }
}
