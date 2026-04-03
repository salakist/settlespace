using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Persons.Commands
{
    /// <summary>
    /// Base command containing fields shared by person creation and update operations.
    /// </summary>
    public abstract class PersonMutationCommand
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public PersonRole? Role { get; set; }
        public List<AddressCommand> Addresses { get; set; } = [];
    }
}

