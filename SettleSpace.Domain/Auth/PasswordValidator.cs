using System.Text.RegularExpressions;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Auth;

/// <summary>
/// Service for validating password strength against security standards.
/// </summary>
public partial class PasswordValidator : IPasswordValidator
{
    private const int MinimumLength = 8;
    private const int RegexTimeoutMilliseconds = 1_000;

    [GeneratedRegex("[A-Z]", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex UppercasePattern();

    [GeneratedRegex("[a-z]", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex LowercasePattern();

    [GeneratedRegex("[0-9]", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex DigitPattern();

    [GeneratedRegex("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?]", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex SpecialCharPattern();

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
        if (!UppercasePattern().IsMatch(password))
            throw new WeakPasswordException("Password must contain at least one uppercase letter (A-Z).");

        // Check for lowercase
        if (!LowercasePattern().IsMatch(password))
            throw new WeakPasswordException("Password must contain at least one lowercase letter (a-z).");

        // Check for digit
        if (!DigitPattern().IsMatch(password))
            throw new WeakPasswordException("Password must contain at least one digit (0-9).");

        // Check for special character
        if (!SpecialCharPattern().IsMatch(password))
            throw new WeakPasswordException("Password must contain at least one special character (!@#$%^&*()_+-=[]{}';:\"\\\\|,.<>?).");
    }
}
