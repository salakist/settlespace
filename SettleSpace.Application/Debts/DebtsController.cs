using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Debts.Services;
using SettleSpace.Application.Persons.Services;

namespace SettleSpace.Application.Debts;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DebtsController(
    IDebtApplicationService applicationService,
    IDebtMapper debtMapper,
    IPersonDisplayNameResolver personDisplayNameResolver,
    IAuthService authService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(List<DebtSummaryDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<DebtSummaryDto>>> GetCurrentUserDebts()
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        var debts = await applicationService.GetCurrentUserDebtSummariesAsync(personId);
        var counterpartyPersonIds = debts.ConvertAll(debt => debt.CounterpartyPersonId);
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(counterpartyPersonIds);

        return Ok(debts.ConvertAll(debt => debtMapper.ToSummaryDto(debt, personDisplayNames)));
    }

    [HttpGet("me/{counterpartyPersonId}")]
    [ProducesResponseType(typeof(List<DebtDetailsDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<DebtDetailsDto>>> GetCurrentUserDebtDetails(string counterpartyPersonId)
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        var details = await applicationService.GetCurrentUserDebtDetailsAsync(personId, counterpartyPersonId);
        var relatedPersonIds = details.ConvertAll(detail => detail.CounterpartyPersonId);
        relatedPersonIds.AddRange(details
            .SelectMany(detail => detail.Transactions)
            .SelectMany(transaction => transaction.GetRelatedPersonIds()));
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(relatedPersonIds);

        return Ok(details.ConvertAll(detail => debtMapper.ToDetailsDto(detail, personDisplayNames)));
    }

    [HttpPost("settlements")]
    [ProducesResponseType(typeof(DebtSettlementResultDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<DebtSettlementResultDto>> Settle([FromBody] SettleDebtCommand command)
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        var settlementResult = await applicationService.SettleCurrentUserDebtAsync(personId, command);
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync([settlementResult.CounterpartyPersonId]);

        return Ok(debtMapper.ToSettlementResultDto(settlementResult, personDisplayNames));
    }
}
