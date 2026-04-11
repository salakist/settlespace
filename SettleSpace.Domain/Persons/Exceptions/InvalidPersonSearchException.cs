using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

public class InvalidPersonSearchException : BadRequestException
{
    public InvalidPersonSearchException()
    {
    }

    public InvalidPersonSearchException(string message)
        : base(message)
    {
    }

    public InvalidPersonSearchException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
