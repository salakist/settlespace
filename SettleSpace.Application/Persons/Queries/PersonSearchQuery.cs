using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

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

    public void Validate()
    {
        ValidateText(nameof(FreeText), FreeText);
        ValidateStringList(nameof(FirstName), FirstName);
        ValidateStringList(nameof(LastName), LastName);
        ValidateStringList(nameof(PhoneNumber), PhoneNumber);
        ValidateStringList(nameof(Email), Email);
        ValidateDateList(DateOfBirth);
        ValidateDateScalar(nameof(DateOfBirthBefore), DateOfBirthBefore);
        ValidateDateScalar(nameof(DateOfBirthAfter), DateOfBirthAfter);
        ValidateDateRangeConsistency(DateOfBirthBefore, DateOfBirthAfter);
        ValidateDateOfBirthMutualExclusion(DateOfBirth, DateOfBirthBefore, DateOfBirthAfter);
        ValidateRoleList(Role);
        ValidateStringList(nameof(Address), Address);
        ValidateStringList(nameof(PostalCode), PostalCode);
        ValidateStringList(nameof(City), City);
        ValidateStringList(nameof(StateOrRegion), StateOrRegion);
        ValidateStringList(nameof(Country), Country);
    }

    private static void ValidateText(string propertyName, string? value)
    {
        if (value is not null && string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidPersonSearchException($"{propertyName} must not be empty or whitespace when provided.");
        }
    }

    private static void ValidateStringList(string propertyName, List<string>? values)
    {
        if (values is null)
        {
            return;
        }

        if (values.Count == 0)
        {
            throw new InvalidPersonSearchException($"{propertyName} list must not be empty when provided.");
        }

        if (values.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidPersonSearchException($"Each {propertyName} value must not be empty or whitespace.");
        }
    }

    private static void ValidateRoleList(List<PersonRole>? roles)
    {
        if (roles is null)
        {
            return;
        }

        if (roles.Count == 0)
        {
            throw new InvalidPersonSearchException("Role list must not be empty when provided.");
        }

        if (roles.Any(role => !Enum.IsDefined(typeof(PersonRole), role)))
        {
            throw new InvalidPersonSearchException("Each role must be a valid PersonRole value.");
        }
    }

    private static void ValidateDateList(List<DateOnly>? dates)
    {
        if (dates is null)
        {
            return;
        }

        if (dates.Count == 0)
        {
            throw new InvalidPersonSearchException("DateOfBirth list must not be empty when provided.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (dates.Contains(default))
        {
            throw new InvalidPersonSearchException("Each DateOfBirth value must be a valid date.");
        }

        if (dates.Any(date => date > today))
        {
            throw new InvalidPersonSearchException("DateOfBirth must not be in the future.");
        }
    }

    private static void ValidateDateScalar(string propertyName, DateOnly? date)
    {
        if (date is null)
        {
            return;
        }

        if (date == default)
        {
            throw new InvalidPersonSearchException($"{propertyName} must be a valid date when provided.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (date > today)
        {
            throw new InvalidPersonSearchException($"{propertyName} must not be in the future.");
        }
    }

    private static void ValidateDateRangeConsistency(DateOnly? before, DateOnly? after)
    {
        if (before is not null && after is not null && before < after)
        {
            throw new InvalidPersonSearchException(
                "DateOfBirthBefore must be greater than or equal to DateOfBirthAfter.");
        }
    }

    private static void ValidateDateOfBirthMutualExclusion(
        List<DateOnly>? exactDates,
        DateOnly? dateOfBirthBefore,
        DateOnly? dateOfBirthAfter)
    {
        var hasExactDates = exactDates is not null && exactDates.Count > 0;
        var hasRangeBounds = dateOfBirthBefore is not null || dateOfBirthAfter is not null;

        if (hasExactDates && hasRangeBounds)
        {
            throw new InvalidPersonSearchException(
                "Cannot use exact DateOfBirth with DateOfBirthBefore or DateOfBirthAfter. " +
                "Use either exact date(s) or a date range, but not both.");
        }
    }
}
