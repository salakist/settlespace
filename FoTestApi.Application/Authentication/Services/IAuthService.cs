using FoTestApi.Application.Authentication.Commands;
using FoTestApi.Application.Persons.Commands;
using FoTestApi.Application.Authentication;

namespace FoTestApi.Application.Authentication.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCommand command);
        Task<LoginResponseDto> RegisterAsync(RegisterCommand command);
        Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command);
    }
}

