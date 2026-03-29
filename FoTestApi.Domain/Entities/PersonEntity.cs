using System.Net.Mail;
using System.Text.RegularExpressions;

namespace FoTestApi.Domain.Entities
{
    /// <summary>
    /// PersonEntity is the aggregate root for the Person domain.
    /// It encapsulates the business rules and invariants for persons.
    /// </summary>
    public class PersonEntity
    {
        private static readonly Regex PhoneNumberPattern = new(@"^(?=.*\d)[0-9+()\-.\s]{7,20}$", RegexOptions.Compiled);

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
        /// Validates that the person has non-empty first and last names.
        /// Password strength validation is handled at the application boundary
        /// before passwords are hashed for persistence.
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown when names are null or empty.</exception>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(FirstName))
                throw new InvalidOperationException("FirstName cannot be empty.");

            if (string.IsNullOrWhiteSpace(LastName))
                throw new InvalidOperationException("LastName cannot be empty.");

            ValidatePhoneNumber();
            ValidateEmail();
            ValidateDateOfBirth();
            ValidateAddresses();
        }

        /// <summary>
        /// Checks if this person matches another by case-insensitive full name comparison.
        /// </summary>
        public bool MatchesByFullName(PersonEntity other)
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

            if (!PhoneNumberPattern.IsMatch(PhoneNumber.Trim()))
            {
                throw new InvalidOperationException("PhoneNumber is invalid.");
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
                    throw new InvalidOperationException("Email is invalid.");
                }
            }
            catch (FormatException)
            {
                throw new InvalidOperationException("Email is invalid.");
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
                throw new InvalidOperationException("DateOfBirth cannot be in the future.");
            }
        }

        private void ValidateAddresses()
        {
            foreach (var address in Addresses)
            {
                address.Validate();
            }
        }
    }
}
