using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Application.Transactions.Services;
using SettleSpace.Domain.Transactions.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Transactions
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController(
        ITransactionApplicationService applicationService,
        ITransactionMapper transactionMapper,
        IPersonDisplayNameResolver personDisplayNameResolver,
        IAuthService authService) : ControllerBase
    {
        [HttpPost("search")]
        [ProducesResponseType(typeof(List<TransactionDto>), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        public async Task<ActionResult<List<TransactionDto>>> SearchTransactions([FromBody] TransactionSearchQuery query)
        {
            query.Validate();
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var transactions = await applicationService.SearchTransactionsAsync(personId, personRole, query);
            var relatedPersonIds = transactions.SelectMany(transaction => transaction.GetRelatedPersonIds()).ToList();
            var personDisplayNames = await personDisplayNameResolver.ResolveAsync(relatedPersonIds);

            return Ok(transactions.ConvertAll(transaction => transactionMapper.ToDto(transaction, personDisplayNames)));
        }

        [HttpGet("{id:length(24)}")]
        [ProducesResponseType(typeof(TransactionDto), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 403)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        public async Task<ActionResult<TransactionDto>> GetById(string id)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var transaction = await applicationService.GetTransactionByIdAsync(id, personId, personRole);
            var personDisplayNames = await personDisplayNameResolver.ResolveAsync(transaction.GetRelatedPersonIds());

            return Ok(transactionMapper.ToDto(transaction, personDisplayNames));
        }

        [HttpPost]
        [ProducesResponseType(typeof(TransactionDto), 201)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 403)]
        public async Task<IActionResult> Post([FromBody] CreateTransactionCommand command)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            var transaction = await applicationService.CreateTransactionAsync(personId, personRole, command);
            var personDisplayNames = await personDisplayNameResolver.ResolveAsync(transaction.GetRelatedPersonIds());

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, transactionMapper.ToDto(transaction, personDisplayNames));
        }

        [HttpPut("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 403)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateTransactionCommand command)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            await applicationService.UpdateTransactionAsync(id, personId, personRole, command);

            return NoContent();
        }

        [HttpDelete("{id:length(24)}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(typeof(ProblemDetails), 401)]
        [ProducesResponseType(typeof(ProblemDetails), 403)]
        [ProducesResponseType(typeof(ProblemDetails), 404)]
        public async Task<IActionResult> Delete(string id)
        {
            var (personId, personRole) = authService.ResolveAuthContext(User);
            await applicationService.DeleteTransactionAsync(id, personId, personRole);

            return NoContent();
        }
    }
}
