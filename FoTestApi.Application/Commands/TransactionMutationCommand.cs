using FoTestApi.Domain.Entities;

namespace FoTestApi.Application.Commands
{
    public abstract class TransactionMutationCommand
    {
        public string PayerPersonId { get; set; } = null!;
        public string PayeePersonId { get; set; } = null!;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "EUR";
        public DateTime TransactionDateUtc { get; set; }
        public string Description { get; set; } = null!;
        public string? Category { get; set; }
        public TransactionStatus Status { get; set; } = TransactionStatus.Completed;
    }
}
