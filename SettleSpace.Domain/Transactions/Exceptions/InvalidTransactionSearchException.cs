using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Transactions.Exceptions;

public class InvalidTransactionSearchException : BadRequestException
{
    public InvalidTransactionSearchException()
    {
    }

    public InvalidTransactionSearchException(string message)
        : base(message)
    {
    }

    public InvalidTransactionSearchException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
