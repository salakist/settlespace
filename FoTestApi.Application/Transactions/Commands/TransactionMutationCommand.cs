using FoTestApi.Domain.Transactions.Entities;
using System.Text.Json.Serialization;

namespace FoTestApi.Application.Transactions.Commands
{
    public abstract class TransactionMutationCommand
    {
        public string PayerPersonId { get; set; } = null!;
        public string PayeePersonId { get; set; } = null!;
        [JsonRequired]
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "EUR";
        [JsonRequired]
        public DateTime TransactionDateUtc { get; set; }
        public string Description { get; set; } = null!;
        public string? Category { get; set; }
        public TransactionStatus Status { get; set; } = TransactionStatus.Completed;
    }
}


