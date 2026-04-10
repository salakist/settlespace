using System.Security.Claims;
using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Authentication.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCommand command);
        Task<LoginResponseDto> RegisterAsync(RegisterCommand command);
        Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command);
        (string PersonId, PersonRole Role) ResolveAuthContext(ClaimsPrincipal user);
    }
}
