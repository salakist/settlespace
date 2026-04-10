using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SettleSpace.Application.Authentication.Commands;
using SettleSpace.Application.Authentication.Mapping;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SettleSpace.Application.Authentication.Services
{
    public class AuthService(
        IPersonRepository personRepository,
        IOptions<AuthSettings> authOptions,
        IPasswordHashingService passwordHashingService,
        IPersonApplicationService personApplicationService,
        IPasswordValidator passwordValidator,
        IAuthMapper authMapper) : IAuthService
    {
        public async Task<LoginResponseDto?> LoginAsync(LoginCommand command)
        {
            var (firstName, lastName) = ParseUsername(command.Username);
            if (firstName is null || lastName is null)
            {
                return null;
            }

            var person = await personRepository.FindByFullNameAsync(firstName, lastName);
            if (person is null || string.IsNullOrEmpty(person.Password))
            {
                return null;
            }

            var passwordIsHashed = passwordHashingService.IsPasswordHash(person.Password);
            var passwordMatches = passwordIsHashed
                ? passwordHashingService.VerifyPassword(command.Password, person.Password)
                : string.Equals(command.Password, person.Password, StringComparison.Ordinal);

            if (!passwordMatches)
            {
                return null;
            }

            if (!passwordIsHashed && !string.IsNullOrEmpty(person.Id))
            {
                person.Password = passwordHashingService.HashPassword(command.Password);
                await personRepository.UpdateAsync(person.Id, person);
            }

            var resolvedUsername = person.Username;

            var expiresAtUtc = DateTime.UtcNow.AddMinutes(authOptions.Value.TokenExpirationMinutes);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, resolvedUsername),
                new Claim(JwtRegisteredClaimNames.UniqueName, resolvedUsername),
                new Claim(ClaimTypes.Name, resolvedUsername),
                new Claim(ClaimTypes.Role, person.Role.ToString()),
                new Claim(CustomClaimTypes.PersonId, person.Id!),
                new Claim(CustomClaimTypes.PersonRole, person.Role.ToString())
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.Value.JwtKey)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: authOptions.Value.Issuer,
                audience: authOptions.Value.Audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials);

            return authMapper.ToLoginResponseDto(
                person,
                new JwtSecurityTokenHandler().WriteToken(token),
                expiresAtUtc);
        }

        public async Task<LoginResponseDto> RegisterAsync(RegisterCommand command)
        {
            var createdPerson = await personApplicationService.CreatePersonAsync(authMapper.ToCreatePersonCommand(command));

            var loginResponse = await LoginAsync(authMapper.ToLoginCommand(createdPerson.Username, command.Password));

            return loginResponse ?? throw new InvalidOperationException("Registration succeeded but auto-login failed.");
        }

        public async Task<bool> ChangePasswordAsync(string personId, ChangePasswordCommand command)
        {
            var person = await personRepository.GetByIdAsync(personId);
            if (person is null || string.IsNullOrEmpty(person.Password) || string.IsNullOrEmpty(person.Id))
            {
                return false;
            }

            var currentPasswordMatches = passwordHashingService.IsPasswordHash(person.Password)
                ? passwordHashingService.VerifyPassword(command.CurrentPassword, person.Password)
                : string.Equals(command.CurrentPassword, person.Password, StringComparison.Ordinal);

            if (!currentPasswordMatches)
            {
                return false;
            }

            passwordValidator.Validate(command.NewPassword);

            person.Password = passwordHashingService.HashPassword(command.NewPassword);
            await personRepository.UpdateAsync(person.Id, person);
            return true;
        }

        public (string PersonId, PersonRole Role) ResolveAuthContext(ClaimsPrincipal user)
        {
            if (user?.Identity?.IsAuthenticated != true)
            {
                throw new AuthContextException();
            }

            var personId = user.FindFirstValue(CustomClaimTypes.PersonId) ?? string.Empty;
            var roleValue = user.FindFirstValue(CustomClaimTypes.PersonRole) ?? user.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrWhiteSpace(personId))
            {
                throw new AuthContextException();
            }

            if (string.IsNullOrWhiteSpace(roleValue)
                || !Enum.TryParse<PersonRole>(roleValue, ignoreCase: true, out var personRole)
                || !Enum.IsDefined(personRole))
            {
                personRole = PersonRole.USER;
            }

            return (personId, personRole);
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
