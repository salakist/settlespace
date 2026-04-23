using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

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

    public void Validate()
    {
        ValidateText(FreeText, "FreeText");
        ValidateStringList(FirstName, "FirstName");
        ValidateStringList(LastName, "LastName");
        ValidateStringList(PhoneNumber, "PhoneNumber");
        ValidateStringList(Email, "Email");
        ValidateStringList(Address, "Address");
        ValidateStringList(PostalCode, "PostalCode");
        ValidateStringList(City, "City");
        ValidateStringList(StateOrRegion, "StateOrRegion");
        ValidateStringList(Country, "Country");
        ValidateRoleList(Role);
        ValidateDateList(DateOfBirth);
        ValidateDateScalar(DateOfBirthBefore, "DateOfBirthBefore");
        ValidateDateRangeConsistency(DateOfBirthBefore, DateOfBirthAfter);
        ValidateDateOfBirthMutualExclusion(DateOfBirth, DateOfBirthBefore, DateOfBirthAfter);
    }

    private static void ValidateText(string? value, string fieldName)
    {
        if (value is not null && string.IsNullOrWhiteSpace(value))
            throw new InvalidPersonSearchException($"{fieldName} must not be empty or whitespace.");
    }

    private static void ValidateStringList(List<string>? list, string fieldName)
    {
        if (list is null) return;
        if (list.Count == 0)
            throw new InvalidPersonSearchException($"{fieldName} list must not be empty.");
        if (list.Any(string.IsNullOrWhiteSpace))
            throw new InvalidPersonSearchException($"{fieldName} list must not contain empty or whitespace values.");
    }

    private static void ValidateRoleList(List<PersonRole>? list)
    {
        if (list?.Count == 0)
            throw new InvalidPersonSearchException("Role list must not be empty.");
    }

    private static void ValidateDateList(List<DateOnly>? list)
    {
        if (list is null) return;
        if (list.Count == 0)
            throw new InvalidPersonSearchException("DateOfBirth list must not be empty.");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (list.Any(d => d > today))
            throw new InvalidPersonSearchException("DateOfBirth values must not be in the future.");
    }

    private static void ValidateDateScalar(DateOnly? value, string fieldName)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (value is not null && value > today)
            throw new InvalidPersonSearchException($"{fieldName} must not be in the future.");
    }

    private static void ValidateDateRangeConsistency(DateOnly? before, DateOnly? after)
    {
        if (before is not null && after is not null && before <= after)
            throw new InvalidPersonSearchException("DateOfBirthBefore must be later than DateOfBirthAfter.");
    }

    private static void ValidateDateOfBirthMutualExclusion(List<DateOnly>? exact, DateOnly? before, DateOnly? after)
    {
        if (exact is { Count: > 0 } && (before is not null || after is not null))
            throw new InvalidPersonSearchException("DateOfBirth cannot be combined with DateOfBirthBefore or DateOfBirthAfter.");
    }
}
