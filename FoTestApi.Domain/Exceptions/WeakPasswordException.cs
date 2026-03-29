namespace FoTestApi.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when a password does not meet security requirements.
    /// </summary>
    public class WeakPasswordException : DomainException
    {
        public WeakPasswordException(string details = "Password does not meet security requirements.")
            : base($"Weak password: {details}")
        {
        }
    }
}
