using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Transactions.Exceptions
{
    public class InvalidTransactionException : BadRequestException
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

