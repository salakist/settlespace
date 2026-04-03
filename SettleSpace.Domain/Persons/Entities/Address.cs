using SettleSpace.Domain.Persons.Exceptions;
using System.Text.RegularExpressions;

namespace SettleSpace.Domain.Persons.Entities
{
    public partial class Address
    {
        private const int RegexTimeoutMilliseconds = 1_000;

        [GeneratedRegex(@"^[A-Za-z0-9\-\s]{3,12}$", RegexOptions.None, RegexTimeoutMilliseconds)]
        private static partial Regex PostalCodePattern();

        public string Label { get; set; } = null!;
        public string StreetLine1 { get; set; } = null!;
        public string? StreetLine2 { get; set; }
        public string PostalCode { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? StateOrRegion { get; set; }
        public string Country { get; set; } = null!;

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Label))
            {
                throw new InvalidAddressException("Address label cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(StreetLine1))
            {
                throw new InvalidAddressException("Address street line 1 cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(PostalCode) || !PostalCodePattern().IsMatch(PostalCode.Trim()))
            {
                throw new InvalidAddressException("Address postal code is invalid.");
            }

            if (string.IsNullOrWhiteSpace(City))
            {
                throw new InvalidAddressException("Address city cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(Country))
            {
                throw new InvalidAddressException("Address country cannot be empty.");
            }
        }
    }
}
