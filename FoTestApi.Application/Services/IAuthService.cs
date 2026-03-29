using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;

namespace FoTestApi.Application.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCommand command);
        Task<LoginResponseDto> RegisterAsync(RegisterCommand command);
        Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command);
    }
}