using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Domain.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Authentication;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginCommand command)
    {
        var response = await authService.LoginAsync(command) ?? throw new InvalidCredentialsException();
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(LoginResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterCommand command)
    {
        var loginResponse = await authService.RegisterAsync(command);
        return Ok(loginResponse);
    }

    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var (personId, _) = authService.ResolveAuthContext(User);

        var changed = await authService.ChangePasswordAsync(personId, command);
        if (!changed)
        {
            throw new InvalidCurrentPasswordException();
        }

        return NoContent();
    }
}
