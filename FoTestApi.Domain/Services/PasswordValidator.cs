using System.Text.RegularExpressions;
using FoTestApi.Domain.Exceptions;

namespace FoTestApi.Domain.Services
{
    /// <summary>
    /// Service for validating password strength against security standards.
    /// </summary>
    public class PasswordValidator
    {
        private const int MinimumLength = 8;
        private const string UppercasePattern = "[A-Z]";
        private const string LowercasePattern = "[a-z]";
        private const string DigitPattern = "[0-9]";
        private const string SpecialCharPattern = "[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?]";

        /// <summary>
        /// Validates that a password meets security requirements.
        /// A strong password must contain:
        /// - At least 8 characters
        /// - At least one uppercase letter (A-Z)
        /// - At least one lowercase letter (a-z)
        /// - At least one digit (0-9)
        /// - At least one special character (!@#$%^&*()_+-=[]{}';:"\\|,.<>?)
        /// </summary>
        /// <exception cref="WeakPasswordException">Thrown when password does not meet requirements.</exception>
        public void Validate(string? password)
        {
            // Password is optional, so null is acceptable
            if (string.IsNullOrEmpty(password))
                return;

            // Check minimum length
            if (password.Length < MinimumLength)
                throw new WeakPasswordException($"Password must be at least {MinimumLength} characters long.");

            // Check for uppercase
            if (!Regex.IsMatch(password, UppercasePattern))
                throw new WeakPasswordException("Password must contain at least one uppercase letter (A-Z).");

            // Check for lowercase
            if (!Regex.IsMatch(password, LowercasePattern))
                throw new WeakPasswordException("Password must contain at least one lowercase letter (a-z).");

            // Check for digit
            if (!Regex.IsMatch(password, DigitPattern))
                throw new WeakPasswordException("Password must contain at least one digit (0-9).");

            // Check for special character
            if (!Regex.IsMatch(password, SpecialCharPattern))
                throw new WeakPasswordException("Password must contain at least one special character (!@#$%^&*()_+-=[]{}';:\"\\\\|,.<>?).");
        }
    }
}
