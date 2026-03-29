using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Application.Services;
using FoTestApi.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoTestApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPersonApplicationService _personApplicationService;

        public AuthController(
            IAuthService authService,
            IPersonApplicationService personApplicationService)
        {
            _authService = authService;
            _personApplicationService = personApplicationService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(401)]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginCommand command)
        {
            var response = await _authService.LoginAsync(command);
            if (response is null)
            {
                return Unauthorized(new { error = "Invalid username or password." });
            }

            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(409)]
        public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterCommand command)
        {
            var createdPerson = await _personApplicationService.CreatePersonAsync(new CreatePersonCommand
            {
                FirstName = command.FirstName,
                LastName = command.LastName,
                Password = command.Password
            });

            var loginResponse = await _authService.LoginAsync(new LoginCommand
            {
                Username = $"{createdPerson.FirstName}.{createdPerson.LastName}",
                Password = command.Password
            });

            if (loginResponse is null)
            {
                throw new InvalidOperationException("Registration succeeded but auto-login failed.");
            }

            return Ok(loginResponse);
        }

        [Authorize]
        [HttpPost("change-password")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(username))
            {
                return Unauthorized(new { error = "Authentication context is missing." });
            }

            try
            {
                var changed = await _authService.ChangePasswordAsync(username, command);
                if (!changed)
                {
                    return BadRequest(new { error = "Current password is invalid." });
                }

                return NoContent();
            }
            catch (WeakPasswordException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}