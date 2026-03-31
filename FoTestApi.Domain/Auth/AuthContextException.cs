using FoTestApi.Domain.Exceptions;

namespace FoTestApi.Domain.Auth
{
    public class AuthContextException : DomainException
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
}
