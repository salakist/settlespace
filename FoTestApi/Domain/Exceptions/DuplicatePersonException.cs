namespace FoTestApi.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when attempting to create or update a person with a duplicate full name.
    /// </summary>
    public class DuplicatePersonException : DomainException
    {
        public DuplicatePersonException(string firstName, string lastName)
            : base($"A person with first name '{firstName}' and last name '{lastName}' already exists.")
        {
        }
    }

    /// <summary>
    /// Base class for all domain exceptions.
    /// </summary>
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message) { }
    }
}
