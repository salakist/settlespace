using FoTestApi.Domain.Services;

namespace FoTestApi.Domain.Entities
{
    /// <summary>
    /// PersonEntity is the aggregate root for the Person domain.
    /// It encapsulates the business rules and invariants for persons.
    /// </summary>
    public class PersonEntity
    {
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
        /// Validates that the person has non-empty first and last names,
        /// and that the password (if provided) meets security requirements.
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown when names are null or empty.</exception>
        /// <exception cref="WeakPasswordException">Thrown when password does not meet security requirements.</exception>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(FirstName))
                throw new InvalidOperationException("FirstName cannot be empty.");

            if (string.IsNullOrWhiteSpace(LastName))
                throw new InvalidOperationException("LastName cannot be empty.");

            // Validate password strength if provided
            if (!string.IsNullOrEmpty(Password))
            {
                var passwordValidator = new PasswordValidator();
                passwordValidator.Validate(Password);
            }
        }

        /// <summary>
        /// Checks if this person matches another by case-insensitive full name comparison.
        /// </summary>
        public bool MatchesByFullName(PersonEntity other)
        {
            return string.Equals(FirstName, other.FirstName, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(LastName, other.LastName, StringComparison.OrdinalIgnoreCase);
        }
    }
}
