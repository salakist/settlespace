using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Persons.Queries;

public class PersonSearchQuery
{
    public string? FreeText { get; set; }
    public List<string>? FirstName { get; set; }
    public List<string>? LastName { get; set; }
    public List<string>? PhoneNumber { get; set; }
    public List<string>? Email { get; set; }
    public List<DateOnly>? DateOfBirth { get; set; }
    public DateOnly? DateOfBirthBefore { get; set; }
    public DateOnly? DateOfBirthAfter { get; set; }
    public List<PersonRole>? Role { get; set; }
    public List<string>? Address { get; set; }
    public List<string>? PostalCode { get; set; }
    public List<string>? City { get; set; }
    public List<string>? StateOrRegion { get; set; }
    public List<string>? Country { get; set; }
}
