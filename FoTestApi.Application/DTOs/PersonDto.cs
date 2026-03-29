namespace FoTestApi.Application.DTOs
{
    /// <summary>
    /// Data Transfer Object for Person responses.
    /// </summary>
    public class PersonDto
    {
        public string? Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
    }
}
