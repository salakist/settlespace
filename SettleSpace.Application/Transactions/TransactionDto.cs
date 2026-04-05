using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Transactions
{
    public class TransactionDto
    {
        public string? Id { get; set; }
        public string PayerPersonId { get; set; } = null!;
        public string PayerDisplayName { get; set; } = null!;
        public string PayeePersonId { get; set; } = null!;
        public string PayeeDisplayName { get; set; } = null!;
        public string CreatedByPersonId { get; set; } = null!;
        public string CreatedByDisplayName { get; set; } = null!;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = null!;
        public DateTime TransactionDateUtc { get; set; }
        public string Description { get; set; } = null!;
        public string? Category { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }
}


