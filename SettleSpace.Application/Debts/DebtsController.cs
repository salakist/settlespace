using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Debts.Services;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Debts.Entities;

namespace SettleSpace.Application.Debts
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DebtsController : ControllerBase
    {
        private readonly IDebtApplicationService _applicationService;
        private readonly IDebtMapper _debtMapper;
        private readonly IPersonDisplayNameResolver _personDisplayNameResolver;
        private readonly IAuthService _authService;

        public DebtsController(
            IDebtApplicationService applicationService,
            IDebtMapper debtMapper,
            IPersonDisplayNameResolver personDisplayNameResolver,
            IAuthService authService)
        {
            _applicationService = applicationService;
            _debtMapper = debtMapper;
            _personDisplayNameResolver = personDisplayNameResolver;
            _authService = authService;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(List<DebtSummaryDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<DebtSummaryDto>>> GetCurrentUserDebts()
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var debts = await _applicationService.GetCurrentUserDebtSummariesAsync(personId);
            var counterpartyPersonIds = debts.Select(debt => debt.CounterpartyPersonId).ToList();
            var personDisplayNames = await _personDisplayNameResolver.ResolveAsync(counterpartyPersonIds);

            return Ok(debts.Select(debt => _debtMapper.ToSummaryDto(debt, personDisplayNames)).ToList());
        }

        [HttpGet("me/{counterpartyPersonId}")]
        [ProducesResponseType(typeof(List<DebtDetailsDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<DebtDetailsDto>>> GetCurrentUserDebtDetails(string counterpartyPersonId)
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var details = await _applicationService.GetCurrentUserDebtDetailsAsync(personId, counterpartyPersonId);
            var relatedPersonIds = details.ConvertAll(detail => detail.CounterpartyPersonId);
            relatedPersonIds.AddRange(details
                .SelectMany(detail => detail.Transactions)
                .SelectMany(transaction => transaction.GetRelatedPersonIds())
                .ToList());
            var personDisplayNames = await _personDisplayNameResolver.ResolveAsync(relatedPersonIds);

            return Ok(details.Select(detail => _debtMapper.ToDetailsDto(detail, personDisplayNames)).ToList());
        }

        [HttpPost("settlements")]
        [ProducesResponseType(typeof(DebtSettlementResultDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<DebtSettlementResultDto>> Settle([FromBody] SettleDebtCommand command)
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var settlementResult = await _applicationService.SettleCurrentUserDebtAsync(personId, command);
            var personDisplayNames = await _personDisplayNameResolver.ResolveAsync([settlementResult.CounterpartyPersonId]);

            return Ok(_debtMapper.ToSettlementResultDto(settlementResult, personDisplayNames));
        }

    }
}
