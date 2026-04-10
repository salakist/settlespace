using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Auth;

public class AuthContextException : UnauthorizedException
{
    public AuthContextException()
        : base("Authentication context is missing or invalid.")
    {
    }

    public AuthContextException(string message)
        : base(message)
    {
    }

    public AuthContextException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
