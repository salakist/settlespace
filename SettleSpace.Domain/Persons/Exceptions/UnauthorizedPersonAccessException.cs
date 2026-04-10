using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

public class UnauthorizedPersonAccessException : ForbiddenException
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