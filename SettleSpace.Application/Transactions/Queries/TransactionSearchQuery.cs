using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Application.Transactions.Queries
{
    public class TransactionSearchQuery
    {
        public string? FreeText { get; set; }
        public List<TransactionStatus>? Status { get; set; }
        public InvolvementType? Involvement { get; set; }

        public void Validate()
        {
            if (FreeText is not null && string.IsNullOrWhiteSpace(FreeText))
            {
                throw new InvalidTransactionSearchException("FreeText must not be empty or whitespace when provided.");
            }

            if (Status is not null && Status.Count == 0)
            {
                throw new InvalidTransactionSearchException("Status list must not be empty when provided.");
            }
        }
    }
}
