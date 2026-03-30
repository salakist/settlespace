using FoTestApi.Application.Authentication.Commands;
using FoTestApi.Application.Persons.Commands;
using FoTestApi.Application.Authentication.Services;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Persons.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoTestApi.Application.Authentication
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
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
            var loginResponse = await _authService.RegisterAsync(command);
            return Ok(loginResponse);
        }

        [Authorize]
        [HttpPost("change-password")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            var personId = User.FindFirstValue(CustomClaimTypes.PersonId);
            if (string.IsNullOrWhiteSpace(personId))
            {
                return Unauthorized(new { error = "Authentication context is missing." });
            }

            try
            {
                var changed = await _authService.ChangePasswordAsync(personId, command);
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

