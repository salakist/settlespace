using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Debts.Services;

namespace SettleSpace.Application.Debts
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DebtsController : ControllerBase
    {
        private readonly IDebtApplicationService _applicationService;
        private readonly IDebtMapper _debtMapper;
        private readonly IAuthService _authService;

        public DebtsController(
            IDebtApplicationService applicationService,
            IDebtMapper debtMapper,
            IAuthService authService)
        {
            _applicationService = applicationService;
            _debtMapper = debtMapper;
            _authService = authService;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(List<DebtSummaryDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<DebtSummaryDto>>> GetCurrentUserDebts()
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var debts = await _applicationService.GetCurrentUserDebtSummariesAsync(personId);

            return Ok(debts.Select(_debtMapper.ToSummaryDto).ToList());
        }

        [HttpGet("me/{counterpartyPersonId}")]
        [ProducesResponseType(typeof(List<DebtDetailsDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<DebtDetailsDto>>> GetCurrentUserDebtDetails(string counterpartyPersonId)
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var details = await _applicationService.GetCurrentUserDebtDetailsAsync(personId, counterpartyPersonId);

            return Ok(details.Select(_debtMapper.ToDetailsDto).ToList());
        }

        [HttpPost("settlements")]
        [ProducesResponseType(typeof(DebtSettlementResultDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<DebtSettlementResultDto>> Settle([FromBody] SettleDebtCommand command)
        {
            var (personId, _) = _authService.ResolveAuthContext(User);
            var settlementResult = await _applicationService.SettleCurrentUserDebtAsync(personId, command);

            return Ok(_debtMapper.ToSettlementResultDto(settlementResult));
        }
    }
}
