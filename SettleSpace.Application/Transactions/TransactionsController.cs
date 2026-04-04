using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Application.Transactions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Transactions
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionApplicationService _applicationService;
        private readonly ITransactionMapper _transactionMapper;
        private readonly IAuthService _authService;

        public TransactionsController(
            ITransactionApplicationService applicationService,
            ITransactionMapper transactionMapper,
            IAuthService authService)
        {
            _applicationService = applicationService;
            _transactionMapper = transactionMapper;
            _authService = authService;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<TransactionDto>>> GetCurrentUserTransactions()
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            var transactions = await _applicationService.GetCurrentUserTransactionsAsync(personId, personRole);

            return Ok(transactions.Select(_transactionMapper.ToDto).ToList());
        }

        [HttpGet("me/search/{query}")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<TransactionDto>>> SearchCurrentUserTransactions(string query)
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            var transactions = await _applicationService.SearchCurrentUserTransactionsAsync(personId, personRole, query);

            return Ok(transactions.Select(_transactionMapper.ToDto).ToList());
        }

        [HttpPost("search")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<TransactionDto>>> SearchTransactions([FromBody] TransactionSearchQuery query)
        {
            query.Validate();
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            var transactions = await _applicationService.SearchTransactionsAsync(personId, personRole, query);

            return Ok(transactions.Select(_transactionMapper.ToDto).ToList());
        }

        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<TransactionDto>> GetById(string id)
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            var transaction = await _applicationService.GetTransactionByIdAsync(id, personId, personRole);

            return Ok(_transactionMapper.ToDto(transaction));
        }

        [HttpPost]
        [ProducesResponseType(typeof(TransactionDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Post([FromBody] CreateTransactionCommand command)
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            var transaction = await _applicationService.CreateTransactionAsync(personId, personRole, command);

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, _transactionMapper.ToDto(transaction));
        }

        [HttpPut("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateTransactionCommand command)
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            await _applicationService.UpdateTransactionAsync(id, personId, personRole, command);

            return NoContent();
        }

        [HttpDelete("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(string id)
        {
            var (personId, personRole) = _authService.ResolveAuthContext(User);
            await _applicationService.DeleteTransactionAsync(id, personId, personRole);

            return NoContent();
        }
    }
}


