using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Persons.Exceptions;

public class PersonNotFoundException : NotFoundException
{
    public PersonNotFoundException()
    {
    }

    public PersonNotFoundException(string personId)
        : base($"Person with ID '{personId}' not found.")
    {
    }

    public PersonNotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
