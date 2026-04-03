using SettleSpace.Application.Persons.Commands;

namespace SettleSpace.Application.Authentication.Commands
{
    public class RegisterCommand
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public List<AddressCommand> Addresses { get; set; } = [];
    }
}

