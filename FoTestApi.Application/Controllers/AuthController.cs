using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Application.Services;
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
    }
}