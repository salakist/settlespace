namespace FoTestApi.Application.Commands
{
    /// <summary>
    /// Command to update an existing person.
    /// </summary>
    public class UpdatePersonCommand
    {
        public string Id { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public List<AddressCommand> Addresses { get; set; } = [];
    }
}
