using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Auth;

public class InvalidCurrentPasswordException : BadRequestException
{
    public InvalidCurrentPasswordException()
        : this("Current password is invalid.")
    {
    }

    public InvalidCurrentPasswordException(string message)
        : base(message)
    {
    }

    public InvalidCurrentPasswordException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
