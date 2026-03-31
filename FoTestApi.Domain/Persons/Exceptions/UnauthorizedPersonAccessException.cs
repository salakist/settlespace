using FoTestApi.Domain.Exceptions;

namespace FoTestApi.Domain.Persons.Exceptions
{
    public class UnauthorizedPersonAccessException : DomainException
    {
        public UnauthorizedPersonAccessException()
        {
        }

        public UnauthorizedPersonAccessException(string message)
            : base(message)
        {
        }

        public UnauthorizedPersonAccessException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}