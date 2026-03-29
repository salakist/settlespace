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