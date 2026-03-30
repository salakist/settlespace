using FoTestApi.Domain.Exceptions;

namespace FoTestApi.Domain.Transactions.Exceptions
{
    public class InvalidTransactionException : DomainException
    {
        public InvalidTransactionException()
        {
        }

        public InvalidTransactionException(string message)
            : base(message)
        {
        }

        public InvalidTransactionException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}

