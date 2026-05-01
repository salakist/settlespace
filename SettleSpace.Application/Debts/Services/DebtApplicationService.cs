using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Debts.Services;
using SettleSpace.Domain.Transactions;

namespace SettleSpace.Application.Debts.Services;

public interface IDebtApplicationService
{
    Task<List<DebtSummaryDto>> GetCurrentUserDebtSummariesAsync(string loggedPersonId);
    Task<List<DebtDetailsDto>> GetCurrentUserDebtDetailsAsync(string loggedPersonId, string counterpartyPersonId);
    Task<DebtSettlementResultDto> SettleCurrentUserDebtAsync(string loggedPersonId, SettleDebtCommand command);
}

public class DebtApplicationService(
    ITransactionRepository repository,
    IDebtDomainService domainService,
    IDebtMapper debtMapper,
    IPersonDisplayNameResolver personDisplayNameResolver) : IDebtApplicationService
{
    public async Task<List<DebtSummaryDto>> GetCurrentUserDebtSummariesAsync(string loggedPersonId)
    {
        var transactions = await repository.GetByInvolvedPersonIdAsync(loggedPersonId);
        var summaries = domainService.BuildDebtSummaries(transactions, loggedPersonId);
        var counterpartyIds = summaries.ConvertAll(s => s.CounterpartyPersonId);
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(counterpartyIds);

        return summaries.ConvertAll(s => debtMapper.ToSummaryDto(s, personDisplayNames));
    }

    public async Task<List<DebtDetailsDto>> GetCurrentUserDebtDetailsAsync(string loggedPersonId, string counterpartyPersonId)
    {
        var transactions = await repository.GetByInvolvedPersonIdAsync(loggedPersonId);
        var details = domainService.BuildDebtDetails(transactions, loggedPersonId, counterpartyPersonId);
        var relatedPersonIds = details.ConvertAll(d => d.CounterpartyPersonId);
        relatedPersonIds.AddRange(details
            .SelectMany(d => d.Transactions)
            .SelectMany(t => t.GetRelatedPersonIds()));
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(relatedPersonIds);

        return details.ConvertAll(d => debtMapper.ToDetailsDto(d, personDisplayNames));
    }

    public async Task<DebtSettlementResultDto> SettleCurrentUserDebtAsync(string loggedPersonId, SettleDebtCommand command)
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
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync([settlement.CounterpartyPersonId]);

        return debtMapper.ToSettlementResultDto(settlement, personDisplayNames);
    }
}
