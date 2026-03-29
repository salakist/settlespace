using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;

namespace FoTestApi.Application.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCommand command);
    }
}