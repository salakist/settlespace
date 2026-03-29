using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FoTestApi.Application.Authentication;
using FoTestApi.Application.Commands;
using FoTestApi.Application.DTOs;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FoTestApi.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly AuthSettings _authSettings;
        private readonly IPersonRepository _personRepository;
        private readonly IPasswordHashingService _passwordHashingService;
        private readonly IPersonApplicationService _personApplicationService;
        private readonly IPasswordValidator _passwordValidator;

        public AuthService(
            IPersonRepository personRepository,
            IOptions<AuthSettings> authOptions,
            IPasswordHashingService passwordHashingService,
            IPersonApplicationService personApplicationService,
            IPasswordValidator passwordValidator)
        {
            _personRepository = personRepository;
            _authSettings = authOptions.Value;
            _passwordHashingService = passwordHashingService;
            _personApplicationService = personApplicationService;
            _passwordValidator = passwordValidator;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginCommand command)
        {
            var (firstName, lastName) = ParseUsername(command.Username);
            if (firstName is null || lastName is null)
            {
                return null;
            }

            var person = await _personRepository.FindByFullNameAsync(firstName, lastName);
            if (person is null || string.IsNullOrEmpty(person.Password))
            {
                return null;
            }

            var passwordIsHashed = _passwordHashingService.IsPasswordHash(person.Password);
            var passwordMatches = passwordIsHashed
                ? _passwordHashingService.VerifyPassword(command.Password, person.Password)
                : string.Equals(command.Password, person.Password, StringComparison.Ordinal);

            if (!passwordMatches)
            {
                return null;
            }

            if (!passwordIsHashed && !string.IsNullOrEmpty(person.Id))
            {
                person.Password = _passwordHashingService.HashPassword(command.Password);
                await _personRepository.UpdateAsync(person.Id, person);
            }

            var resolvedUsername = $"{person.FirstName}.{person.LastName}";

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(_authSettings.TokenExpirationMinutes);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, resolvedUsername),
                new Claim(JwtRegisteredClaimNames.UniqueName, resolvedUsername),
                new Claim(ClaimTypes.Name, resolvedUsername),
                new Claim(CustomClaimTypes.PersonId, person.Id!)
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

        public async Task<LoginResponseDto> RegisterAsync(RegisterCommand command)
        {
            var createdPerson = await _personApplicationService.CreatePersonAsync(new CreatePersonCommand
            {
                FirstName = command.FirstName,
                LastName = command.LastName,
                Password = command.Password,
                PhoneNumber = command.PhoneNumber,
                Email = command.Email,
                DateOfBirth = command.DateOfBirth,
                Addresses = command.Addresses
            });

            var loginResponse = await LoginAsync(new LoginCommand
            {
                Username = $"{createdPerson.FirstName}.{createdPerson.LastName}",
                Password = command.Password
            });

            return loginResponse ?? throw new InvalidOperationException("Registration succeeded but auto-login failed.");
        }

        public async Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command)
        {
            var person = await _personRepository.GetByIdAsync(personId);
            if (person is null || string.IsNullOrEmpty(person.Password) || string.IsNullOrEmpty(person.Id))
            {
                return false;
            }

            var currentPasswordMatches = _passwordHashingService.IsPasswordHash(person.Password)
                ? _passwordHashingService.VerifyPassword(command.CurrentPassword, person.Password)
                : string.Equals(command.CurrentPassword, person.Password, StringComparison.Ordinal);

            if (!currentPasswordMatches)
            {
                return false;
            }

            _passwordValidator.Validate(command.NewPassword);

            person.Password = _passwordHashingService.HashPassword(command.NewPassword);
            await _personRepository.UpdateAsync(person.Id, person);
            return true;
        }

        private static (string? FirstName, string? LastName) ParseUsername(string username)
        {
            var separatorIndex = username.IndexOf('.');
            if (separatorIndex <= 0 || separatorIndex >= username.Length - 1)
            {
                return (null, null);
            }

            var firstName = username[..separatorIndex].Trim();
            var lastName = username[(separatorIndex + 1)..].Trim();

            return string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)
                ? (null, null)
                : (firstName, lastName);
        }
    }
}