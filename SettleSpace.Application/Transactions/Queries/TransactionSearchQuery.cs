using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Application.Transactions.Queries
{
    public class TransactionSearchQuery
    {
        public string? FreeText { get; set; }
        public List<TransactionStatus>? Status { get; set; }
        public InvolvementType? Involvement { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public List<string>? Involved { get; set; }

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

            if (Category is not null && string.IsNullOrWhiteSpace(Category))
            {
                throw new InvalidTransactionSearchException("Category must not be empty or whitespace when provided.");
            }

            if (Description is not null && string.IsNullOrWhiteSpace(Description))
            {
                throw new InvalidTransactionSearchException("Description must not be empty or whitespace when provided.");
            }

            if (Involved is not null)
            {
                if (Involved.Count == 0)
                {
                    throw new InvalidTransactionSearchException("Involved list must not be empty when provided.");
                }

                if (Involved.Any(string.IsNullOrWhiteSpace))
                {
                    throw new InvalidTransactionSearchException("Each involved person ID must not be empty or whitespace.");
                }
            }
        }
    }
}
