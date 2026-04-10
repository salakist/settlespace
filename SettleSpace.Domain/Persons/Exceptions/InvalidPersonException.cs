using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

public class InvalidPersonException : BadRequestException
{
    public InvalidPersonException()
    {
    }

    public InvalidPersonException(string message)
        : base(message)
    {
    }

    public InvalidPersonException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
