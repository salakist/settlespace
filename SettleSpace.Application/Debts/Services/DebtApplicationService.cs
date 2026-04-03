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

    public class DebtApplicationService : IDebtApplicationService
    {
        private readonly ITransactionRepository _repository;
        private readonly IDebtDomainService _domainService;

        public DebtApplicationService(ITransactionRepository repository, IDebtDomainService domainService)
        {
            _repository = repository;
            _domainService = domainService;
        }

        public async Task<List<DebtSummary>> GetCurrentUserDebtSummariesAsync(string loggedPersonId)
        {
            var transactions = await _repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            return _domainService.BuildDebtSummaries(transactions, loggedPersonId);
        }

        public async Task<List<DebtDetails>> GetCurrentUserDebtDetailsAsync(string loggedPersonId, string counterpartyPersonId)
        {
            var transactions = await _repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            return _domainService.BuildDebtDetails(transactions, loggedPersonId, counterpartyPersonId);
        }

        public async Task<DebtSettlementResult> SettleCurrentUserDebtAsync(string loggedPersonId, SettleDebtCommand command)
        {
            var transactions = await _repository.GetByInvolvedPersonIdAsync(loggedPersonId);
            var settlement = _domainService.CreateSettlement(
                transactions,
                loggedPersonId,
                command.CounterpartyPersonId,
                command.Amount,
                command.CurrencyCode,
                command.Description);

            settlement.SettlementTransaction = await _repository.AddAsync(settlement.SettlementTransaction);
            return settlement;
        }
    }
}
