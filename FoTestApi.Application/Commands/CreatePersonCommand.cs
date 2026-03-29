namespace FoTestApi.Application.Commands
{
    /// <summary>
    /// Command to create a new person.
    /// </summary>
    public class CreatePersonCommand
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? Password { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public List<AddressCommand> Addresses { get; set; } = [];
    }
}
