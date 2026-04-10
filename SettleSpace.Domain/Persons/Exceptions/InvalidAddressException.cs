using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

public class InvalidAddressException : BadRequestException
{
    public InvalidAddressException()
    {
    }

    public InvalidAddressException(string message)
        : base(message)
    {
    }

    public InvalidAddressException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
