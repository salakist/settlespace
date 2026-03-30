namespace FoTestApi.Application.Persons.Commands
{
    /// <summary>
    /// Command to create a new person.
    /// </summary>
    public class CreatePersonCommand : PersonMutationCommand
    {
        public string? Password { get; set; }
    }
}


