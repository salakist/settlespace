using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Transactions;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController(
    ITransactionApplicationService applicationService,
    IAuthService authService) : ControllerBase
{
    [HttpPost("search")]
    [ProducesResponseType(typeof(List<TransactionDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<TransactionDto>>> SearchTransactions([FromBody] TransactionSearchQuery query)
    {
        var (personId, personRole) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.SearchTransactionsAsync(personId, personRole, query));
    }

    [HttpGet("{id:length(24)}")]
    [ProducesResponseType(typeof(TransactionDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<ActionResult<TransactionDto>> GetById(string id)
    {
        var (personId, personRole) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.GetTransactionByIdAsync(id, personId, personRole));
    }

    [HttpPost]
    [ProducesResponseType(typeof(TransactionDto), 201)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    public async Task<IActionResult> Post([FromBody] CreateTransactionCommand command)
    {
        var (personId, personRole) = authService.ResolveAuthContext(User);
        var dto = await applicationService.CreateTransactionAsync(personId, personRole, command);

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
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

    [HttpPost("{id:length(24)}/confirm")]
    [ProducesResponseType(typeof(TransactionDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<ActionResult<TransactionDto>> Confirm(string id)
    {
        var (personId, personRole) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.ConfirmTransactionAsync(id, personId, personRole));
    }

    [HttpPost("{id:length(24)}/refuse")]
    [ProducesResponseType(typeof(TransactionDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<ActionResult<TransactionDto>> Refuse(string id)
    {
        var (personId, personRole) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.RefuseTransactionAsync(id, personId, personRole));
    }
}
