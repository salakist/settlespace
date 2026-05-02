namespace SettleSpace.Infrastructure;

public class SettleSpaceDatabaseSettings
{
    public string ConnectionString { get; set; } = null!;
    public string DatabaseName { get; set; } = null!;
    public string PersonsCollectionName { get; set; } = null!;
    public string TransactionsCollectionName { get; set; } = null!;
    public string NotificationsCollectionName { get; set; } = null!;
}
