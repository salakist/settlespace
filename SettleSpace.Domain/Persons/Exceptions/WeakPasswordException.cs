using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions
{
    /// <summary>
    /// Exception thrown when a password does not meet security requirements.
    /// </summary>
    public class WeakPasswordException : BadRequestException
    {
        public WeakPasswordException()
            : this("Password does not meet security requirements.")
        {
        }

        public WeakPasswordException(string message)
            : base($"Weak password: {message}")
        {
        }

        public WeakPasswordException(string message, Exception innerException)
            : base($"Weak password: {message}", innerException)
        {
        }
    }
}

