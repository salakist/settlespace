using System.Text;

namespace FoTestApi.Domain.Auth
{
    /// <summary>
    /// Service for generating random passwords that meet security requirements.
    /// </summary>
    public class PasswordGenerator : IPasswordGenerator
    {
        private const int MinimumLength = 12; // Generated passwords are slightly longer for safety
        private const string Uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string Lowercase = "abcdefghijklmnopqrstuvwxyz";
        private const string Digits = "0123456789";
        private const string SpecialCharacters = "!@#$%^&*()_+-=[]{}';:\"\\|,.<>?";

        /// <summary>
        /// Generates a random password that meets security requirements.
        /// The password will contain:
        /// - At least 12 characters (includes the 5 required + 7 random)
        /// - At least one uppercase letter
        /// - At least one lowercase letter
        /// - At least one digit
        /// - At least one special character
        /// - Additional random characters from a mixed pool
        /// </summary>
        /// <returns>A randomly generated strong password.</returns>
        public string GeneratePassword()
        {
            var random = new Random();
            var password = new StringBuilder();

            // Add one character from each required category
            password.Append(Uppercase[random.Next(Uppercase.Length)]);
            password.Append(Lowercase[random.Next(Lowercase.Length)]);
            password.Append(Digits[random.Next(Digits.Length)]);
            password.Append(SpecialCharacters[random.Next(SpecialCharacters.Length)]);

            // Add additional characters from a mixed pool to reach desired length
            var allCharacters = Uppercase + Lowercase + Digits + SpecialCharacters;
            for (int i = password.Length; i < MinimumLength; i++)
            {
                password.Append(allCharacters[random.Next(allCharacters.Length)]);
            }

            // Shuffle the password to randomize the order of required characters
            return ShuffleString(password.ToString(), random);
        }

        /// <summary>
        /// Shuffles the characters in a string using the Fisher-Yates algorithm.
        /// </summary>
        private static string ShuffleString(string input, Random random)
        {
            var chars = input.ToCharArray();

            for (int i = chars.Length - 1; i > 0; i--)
            {
                int randomIndex = random.Next(i + 1);
                (chars[i], chars[randomIndex]) = (chars[randomIndex], chars[i]);
            }

            return new string(chars);
        }
    }
}

