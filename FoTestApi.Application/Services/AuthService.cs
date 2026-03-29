using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FoTestApi.Application.Authentication;
using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Repositories;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FoTestApi.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly AuthSettings _authSettings;
        private readonly IPersonRepository _personRepository;

        public AuthService(IPersonRepository personRepository, IOptions<AuthSettings> authOptions)
        {
            _personRepository = personRepository;
            _authSettings = authOptions.Value;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginCommand command)
        {
            var separatorIndex = command.Username.IndexOf('.');
            if (separatorIndex <= 0 || separatorIndex >= command.Username.Length - 1)
            {
                return null;
            }

            var firstName = command.Username[..separatorIndex].Trim();
            var lastName = command.Username[(separatorIndex + 1)..].Trim();

            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            {
                return null;
            }

            var person = await _personRepository.FindByFullNameAsync(firstName, lastName);
            if (person is null || string.IsNullOrEmpty(person.Password) ||
                !string.Equals(command.Password, person.Password, StringComparison.Ordinal))
            {
                return null;
            }

            var resolvedUsername = $"{person.FirstName}.{person.LastName}";

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(_authSettings.TokenExpirationMinutes);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, resolvedUsername),
                new Claim(JwtRegisteredClaimNames.UniqueName, resolvedUsername),
                new Claim(ClaimTypes.Name, resolvedUsername)
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authSettings.JwtKey)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _authSettings.Issuer,
                audience: _authSettings.Audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials);

            return new LoginResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Username = resolvedUsername,
                ExpiresAtUtc = expiresAtUtc
            };
        }
    }
}