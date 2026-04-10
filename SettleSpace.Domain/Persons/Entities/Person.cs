using SettleSpace.Domain.Persons.Exceptions;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace SettleSpace.Domain.Persons.Entities;

/// <summary>
/// Person is the aggregate root for the Person domain.
/// It encapsulates the business rules and invariants for persons.
/// </summary>
public partial class Person
{
    private const int RegexTimeoutMilliseconds = 1_000;

    [GeneratedRegex(@"^(?=.*\d)[0-9+()\-.\s]{7,20}$", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex PhoneNumberPattern();

    /// <summary>
    /// The unique identifier for the person.
    /// </summary>
    public string? Id { get; set; }

    /// <summary>
    /// The first name of the person.
    /// </summary>
    public string FirstName { get; set; } = null!;

    /// <summary>
    /// The last name of the person.
    /// </summary>
    public string LastName { get; set; } = null!;

    /// <summary>
    /// The person's full display name derived from their first and last names.
    /// </summary>
    public string DisplayName
    {
        get
        {
            var firstName = FirstName?.Trim() ?? string.Empty;
            var lastName = LastName?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(firstName))
            {
                return string.IsNullOrWhiteSpace(lastName) ? Id ?? string.Empty : lastName;
            }

            if (string.IsNullOrWhiteSpace(lastName))
            {
                return firstName;
            }

            return $"{firstName} {lastName}";
        }
    }

    /// <summary>
    /// The person's username derived from their first and last names.
    /// </summary>
    public string Username
    {
        get
        {
            var firstName = FirstName?.Trim() ?? string.Empty;
            var lastName = LastName?.Trim() ?? string.Empty;

            return string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)
                ? string.Empty
                : $"{firstName}.{lastName}";
        }
    }

    /// <summary>
    /// The password for the person (validated for strength if provided).
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// The person's primary phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// The person's primary email address.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// The person's date of birth.
    /// </summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>
    /// The person's saved addresses.
    /// </summary>
    public List<Address> Addresses { get; set; } = [];

    /// <summary>
    /// The role of the person in the system.
    /// </summary>
    public PersonRole Role { get; set; } = PersonRole.USER;

    /// <summary>
    /// Validates that the person has non-empty first and last names.
    /// Password strength validation is handled at the application boundary
    /// before passwords are hashed for persistence.
    /// </summary>
    /// <exception cref="InvalidPersonException">Thrown when person data is invalid.</exception>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(FirstName))
            throw new InvalidPersonException("FirstName cannot be empty.");

        if (string.IsNullOrWhiteSpace(LastName))
            throw new InvalidPersonException("LastName cannot be empty.");

        ValidatePhoneNumber();
        ValidateEmail();
        ValidateDateOfBirth();
        ValidateAddresses();
        ValidateRole();
    }

    /// <summary>
    /// Checks if this person matches another by case-insensitive full name comparison.
    /// </summary>
    public bool MatchesByFullName(Person other)
    {
        return string.Equals(FirstName, other.FirstName, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(LastName, other.LastName, StringComparison.OrdinalIgnoreCase);
    }

    private void ValidatePhoneNumber()
    {
        if (string.IsNullOrWhiteSpace(PhoneNumber))
        {
            return;
        }

        if (!PhoneNumberPattern().IsMatch(PhoneNumber.Trim()))
        {
            throw new InvalidPersonException("PhoneNumber is invalid.");
        }
    }

    private void ValidateEmail()
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            return;
        }

        try
        {
            var email = new MailAddress(Email.Trim());
            if (!string.Equals(email.Address, Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidPersonException("Email is invalid.");
            }
        }
        catch (FormatException)
        {
            throw new InvalidPersonException("Email is invalid.");
        }
    }

    private void ValidateDateOfBirth()
    {
        if (!DateOfBirth.HasValue)
        {
            return;
        }

        if (DateOfBirth.Value > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidPersonException("DateOfBirth cannot be in the future.");
        }
    }

    private void ValidateAddresses()
    {
        foreach (var address in Addresses)
        {
            address.Validate();
        }
    }

    private void ValidateRole()
    {
        if (!Enum.IsDefined(Role))
        {
            throw new InvalidPersonException("Role is invalid.");
        }
    }
}
