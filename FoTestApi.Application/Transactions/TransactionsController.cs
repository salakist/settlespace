using FoTestApi.Application.Authentication;
using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Application.Transactions;
using FoTestApi.Application.Transactions.Mapping;
using FoTestApi.Application.Transactions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoTestApi.Application.Transactions
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionApplicationService _applicationService;
        private readonly ITransactionMapper _transactionMapper;

        public TransactionsController(
            ITransactionApplicationService applicationService,
            ITransactionMapper transactionMapper)
        {
            _applicationService = applicationService;
            _transactionMapper = transactionMapper;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<TransactionDto>>> GetCurrentUserTransactions()
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            var transactions = await _applicationService.GetCurrentUserTransactionsAsync(personId);
            return Ok(transactions.Select(_transactionMapper.ToDto).ToList());
        }

        [HttpGet("me/search/{query}")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<List<TransactionDto>>> SearchCurrentUserTransactions(string query)
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            var transactions = await _applicationService.SearchCurrentUserTransactionsAsync(personId, query);
            return Ok(transactions.Select(_transactionMapper.ToDto).ToList());
        }

        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<TransactionDto>> GetById(string id)
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            var transaction = await _applicationService.GetTransactionByIdAsync(id, personId);
            return Ok(_transactionMapper.ToDto(transaction));
        }

        [HttpPost]
        [ProducesResponseType(typeof(TransactionDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Post([FromBody] CreateTransactionCommand command)
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            var transaction = await _applicationService.CreateTransactionAsync(personId, command);
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
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            await _applicationService.UpdateTransactionAsync(id, personId, command);
            return NoContent();
        }

        [HttpDelete("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(string id)
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized();
            }

            await _applicationService.DeleteTransactionAsync(id, personId);
            return NoContent();
        }
    }
}


