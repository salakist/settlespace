using System.Text.Json.Serialization;

namespace SettleSpace.Application.Debts.Commands
{
    public class SettleDebtCommand
    {
        public string CounterpartyPersonId { get; set; } = null!;

        [JsonRequired]
        public decimal Amount { get; set; }

        public string CurrencyCode { get; set; } = "EUR";

        public string? Description { get; set; }
    }
}
