namespace SettleSpace.Application.Persons.Commands
{
    public class AddressCommand
    {
        public string Label { get; set; } = null!;
        public string StreetLine1 { get; set; } = null!;
        public string? StreetLine2 { get; set; }
        public string PostalCode { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? StateOrRegion { get; set; }
        public string Country { get; set; } = null!;
    }
}
