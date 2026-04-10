namespace SettleSpace.Domain.Auth;

public interface IPasswordHashingService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
    bool IsPasswordHash(string value);
}
