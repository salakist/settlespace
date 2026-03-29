namespace FoTestApi.Application.Commands
{
    /// <summary>
    /// Command to delete a person.
    /// </summary>
    public class DeletePersonCommand
    {
        public string Id { get; set; } = null!;
    }
}
