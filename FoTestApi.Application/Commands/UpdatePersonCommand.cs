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
        public string? Password { get; set; }
    }
}
