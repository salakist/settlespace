using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Debts.Services;

public interface IDebtDomainService
{
    List<DebtSummary> BuildDebtSummaries(IEnumerable<Transaction> transactions, string currentPersonId);
    List<DebtDetails> BuildDebtDetails(IEnumerable<Transaction> transactions, string currentPersonId, string counterpartyPersonId);
    DebtSettlementResult CreateSettlement(
        IEnumerable<Transaction> transactions,
        string currentPersonId,
        string counterpartyPersonId,
        decimal amount,
        string currencyCode,
        string? description);
}
