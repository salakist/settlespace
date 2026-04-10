using SettleSpace.Application.Debts.Commands;
using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Debts.Services;
using SettleSpace.Domain.Transactions;

namespace SettleSpace.Application.Debts.Services
{
    public interface IDebtApplicationService
    {
        Task<List<DebtSummary>> GetCurrentUserDebtSummariesAsync(string loggedPersonId);
        Task<List<DebtDetails>> GetCurrentUserDebtDetailsAsync(string loggedPersonId, string counterpartyPersonId);
        Task<DebtSettlementResult> SettleCurrentUserDebtAsync(string loggedPersonId, SettleDebtCommand command);
    }

    public class DebtApplicationService(ITransactionRepository repository, IDebtDomainService domainService) : IDebtApplicationService
    {
        public async Task<List<DebtSummary>> GetCurrentUserDebtSummariesAsync(string loggedPersonId)
        {
            var transactions = await repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            return domainService.BuildDebtSummaries(transactions, loggedPersonId);
        }

        public async Task<List<DebtDetails>> GetCurrentUserDebtDetailsAsync(string loggedPersonId, string counterpartyPersonId)
        {
            var transactions = await repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            return domainService.BuildDebtDetails(transactions, loggedPersonId, counterpartyPersonId);
        }

        public async Task<DebtSettlementResult> SettleCurrentUserDebtAsync(string loggedPersonId, SettleDebtCommand command)
        {
            var transactions = await repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            var settlement = domainService.CreateSettlement(
                transactions,
                loggedPersonId,
                command.CounterpartyPersonId,
                command.Amount,
                command.CurrencyCode,
                command.Description);

            settlement.SettlementTransaction = await repository.AddAsync(settlement.SettlementTransaction);
            return settlement;
        }
    }
}
