using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Services;

namespace SettleSpace.Application.Debts;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DebtsController(
    IDebtApplicationService applicationService,
    IAuthService authService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(List<DebtSummaryDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<DebtSummaryDto>>> GetCurrentUserDebts()
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.GetCurrentUserDebtSummariesAsync(personId));
    }

    [HttpGet("me/{counterpartyPersonId}")]
    [ProducesResponseType(typeof(List<DebtDetailsDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<DebtDetailsDto>>> GetCurrentUserDebtDetails(string counterpartyPersonId)
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.GetCurrentUserDebtDetailsAsync(personId, counterpartyPersonId));
    }

    [HttpPost("settlements")]
    [ProducesResponseType(typeof(DebtSettlementResultDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<DebtSettlementResultDto>> Settle([FromBody] SettleDebtCommand command)
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.SettleCurrentUserDebtAsync(personId, command));
    }
}
