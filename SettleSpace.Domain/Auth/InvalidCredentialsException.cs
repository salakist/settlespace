using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Auth
{
    public class InvalidCredentialsException : UnauthorizedException
    {
        public InvalidCredentialsException()
            : this("Invalid username or password.")
        {
        }

        public InvalidCredentialsException(string message)
            : base(message)
        {
        }

        public InvalidCredentialsException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
