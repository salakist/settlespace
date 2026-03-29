namespace FoTestApi
{
    public class FoTestDatabaseSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string PersonsCollectionName { get; set; } = null!;
    }
}