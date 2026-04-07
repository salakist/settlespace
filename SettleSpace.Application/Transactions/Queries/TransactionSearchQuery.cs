using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions;

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
        public List<string>? ManagedBy { get; set; }
        public string? Payer { get; set; }
        public string? Payee { get; set; }

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

            if (ManagedBy is not null)
            {
                if (ManagedBy.Count == 0)
                {
                    throw new InvalidTransactionSearchException("ManagedBy list must not be empty when provided.");
                }

                if (ManagedBy.Any(string.IsNullOrWhiteSpace))
                {
                    throw new InvalidTransactionSearchException("Each ManagedBy person ID must not be empty or whitespace.");
                }
            }

            if (Payer is not null && string.IsNullOrWhiteSpace(Payer))
            {
                throw new InvalidTransactionSearchException("Payer must not be empty or whitespace when provided.");
            }

            if (Payee is not null && string.IsNullOrWhiteSpace(Payee))
            {
                throw new InvalidTransactionSearchException("Payee must not be empty or whitespace when provided.");
            }
        }
    }
}
