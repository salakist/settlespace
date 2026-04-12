using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Domain.Persons;

public record PersonSearchFilter
{
    public string? FreeText { get; init; }
    public List<string>? FirstName { get; init; }
    public List<string>? LastName { get; init; }
    public List<string>? PhoneNumber { get; init; }
    public List<string>? Email { get; init; }
    public List<DateOnly>? DateOfBirth { get; init; }
    public DateOnly? DateOfBirthBefore { get; init; }
    public DateOnly? DateOfBirthAfter { get; init; }
    public List<PersonRole>? Role { get; init; }
    public List<string>? Address { get; init; }
    public List<string>? PostalCode { get; init; }
    public List<string>? City { get; init; }
    public List<string>? StateOrRegion { get; init; }
    public List<string>? Country { get; init; }
}
