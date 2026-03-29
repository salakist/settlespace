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
    }
}
