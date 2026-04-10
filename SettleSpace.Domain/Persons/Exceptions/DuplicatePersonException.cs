using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

/// <summary>
/// Exception thrown when attempting to create or update a person with a duplicate full name.
/// </summary>
public class DuplicatePersonException : ConflictException
{
    public DuplicatePersonException()
        : base("A person with the same full name already exists.")
    {
    }

    public DuplicatePersonException(string message)
        : base(message)
    {
    }

    public DuplicatePersonException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public DuplicatePersonException(string firstName, string lastName)
        : base($"A person with first name '{firstName}' and last name '{lastName}' already exists.")
    {
    }
}
