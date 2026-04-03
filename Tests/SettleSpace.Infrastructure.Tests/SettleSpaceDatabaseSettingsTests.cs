namespace SettleSpace.Infrastructure.Tests;

public class SettleSpaceDatabaseSettingsTests
{
    [Fact]
    public void PropertiesRoundTripAssignedValues()
    {
        var settings = new SettleSpaceDatabaseSettings
        {
            ConnectionString = "mongodb://localhost:27017",
            DatabaseName = "settlespace",
            PersonsCollectionName = "persons"
        };

        Assert.Equal("mongodb://localhost:27017", settings.ConnectionString);
        Assert.Equal("settlespace", settings.DatabaseName);
        Assert.Equal("persons", settings.PersonsCollectionName);
    }
}
