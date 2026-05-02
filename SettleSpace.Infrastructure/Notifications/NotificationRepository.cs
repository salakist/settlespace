using SettleSpace.Domain.Notifications;
using SettleSpace.Domain.Notifications.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

namespace SettleSpace.Infrastructure.Notifications;

public class NotificationRepository : INotificationRepository
{
    private readonly IMongoCollection<Notification> _collection;

    static NotificationRepository()
    {
        if (!BsonClassMap.IsClassMapRegistered(typeof(Notification)))
        {
            BsonClassMap.RegisterClassMap<Notification>(cm =>
            {
                cm.AutoMap();
                cm.MapIdMember(n => n.Id)
                  .SetIdGenerator(StringObjectIdGenerator.Instance)
                  .SetSerializer(new StringSerializer(BsonType.ObjectId));
                cm.MapMember(n => n.RecipientPersonId).SetElementName("recipientPersonId");
                cm.MapMember(n => n.Type)
                    .SetElementName("type")
                    .SetSerializer(new EnumSerializer<NotificationType>(BsonType.String));
                cm.MapMember(n => n.TransactionId).SetElementName("transactionId");
                cm.MapMember(n => n.IsRead).SetElementName("isRead");
                cm.MapMember(n => n.CreatedAtUtc).SetElementName("createdAtUtc");
            });
        }
    }

    public NotificationRepository(IOptions<SettleSpaceDatabaseSettings> databaseSettings)
    {
        var mongoClient = new MongoClient(databaseSettings.Value.ConnectionString);
        var mongoDatabase = mongoClient.GetDatabase(databaseSettings.Value.DatabaseName);
        _collection = mongoDatabase.GetCollection<Notification>(databaseSettings.Value.NotificationsCollectionName);
    }

    internal NotificationRepository(IMongoCollection<Notification> collection)
    {
        _collection = collection;
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        await _collection.InsertOneAsync(notification);
        return notification;
    }

    public async Task<Notification?> GetByIdAsync(string id)
    {
        return await _collection.Find(n => n.Id == id).FirstOrDefaultAsync();
    }

    public async Task<List<Notification>> GetUnreadByRecipientAsync(string recipientPersonId)
    {
        return await _collection
            .Find(n => n.RecipientPersonId == recipientPersonId && !n.IsRead)
            .SortByDescending(n => n.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task MarkReadByIdAsync(string id)
    {
        var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
        await _collection.UpdateOneAsync(n => n.Id == id, update);
    }

    public async Task MarkAllReadByRecipientAsync(string recipientPersonId)
    {
        var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
        await _collection.UpdateManyAsync(
            n => n.RecipientPersonId == recipientPersonId && !n.IsRead,
            update);
    }
}
