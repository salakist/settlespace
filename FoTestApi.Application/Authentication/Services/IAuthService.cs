using System.Security.Claims;
using FoTestApi.Application.Authentication.Commands;
using FoTestApi.Application.Authentication;
using FoTestApi.Domain.Auth;
using FoTestApi.Domain.Persons.Entities;

namespace FoTestApi.Application.Authentication.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCommand command);
        Task<LoginResponseDto> RegisterAsync(RegisterCommand command);
        Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command);
        (string PersonId, PersonRole Role) ResolveAuthContext(ClaimsPrincipal user);
    }
}

