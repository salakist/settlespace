using System.Text.RegularExpressions;

namespace FoTestApi.Domain.Entities
{
    public class Address
    {
        private static readonly Regex PostalCodePattern = new(@"^[A-Za-z0-9\-\s]{3,12}$", RegexOptions.Compiled);

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
                throw new InvalidOperationException("Address label cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(StreetLine1))
            {
                throw new InvalidOperationException("Address street line 1 cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(PostalCode) || !PostalCodePattern.IsMatch(PostalCode.Trim()))
            {
                throw new InvalidOperationException("Address postal code is invalid.");
            }

            if (string.IsNullOrWhiteSpace(City))
            {
                throw new InvalidOperationException("Address city cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(Country))
            {
                throw new InvalidOperationException("Address country cannot be empty.");
            }
        }
    }
}