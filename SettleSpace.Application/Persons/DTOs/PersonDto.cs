using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Persons.DTOs
{
    /// <summary>
    /// Data Transfer Object for Person responses.
    /// </summary>
    public class PersonDto
    {
        public string? Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public PersonRole Role { get; set; }
        public List<AddressDto> Addresses { get; set; } = [];
    }
}


