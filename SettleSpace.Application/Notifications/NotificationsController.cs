using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Notifications.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Notifications;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController(
    INotificationApplicationService applicationService,
    IAuthService authService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationDto>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<List<NotificationDto>>> GetUnread()
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        return Ok(await applicationService.GetMyUnreadAsync(personId));
    }

    [HttpPost("{id:length(24)}/read")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<IActionResult> MarkRead(string id)
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        await applicationService.MarkReadAsync(id, personId);
        return NoContent();
    }

    [HttpPost("read-all")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> MarkAllRead()
    {
        var (personId, _) = authService.ResolveAuthContext(User);
        await applicationService.MarkAllMyReadAsync(personId);
        return NoContent();
    }
}
