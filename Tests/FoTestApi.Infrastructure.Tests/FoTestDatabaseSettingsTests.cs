using FoTestApi.Infrastructure;

namespace FoTestApi.Infrastructure.Tests;

public class FoTestDatabaseSettingsTests
{
    [Fact]
    public void PropertiesRoundTripAssignedValues()
    {
        var settings = new FoTestDatabaseSettings
        {
            ConnectionString = "mongodb://localhost:27017",
            DatabaseName = "fo-test",
            PersonsCollectionName = "persons"
        };

        Assert.Equal("mongodb://localhost:27017", settings.ConnectionString);
        Assert.Equal("fo-test", settings.DatabaseName);
        Assert.Equal("persons", settings.PersonsCollectionName);
    }
}
