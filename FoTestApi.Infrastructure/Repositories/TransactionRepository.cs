using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Repositories;
using FoTestApi.Infrastructure;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace FoTestApi.Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly IMongoCollection<TransactionEntity> _transactionsCollection;

        static TransactionRepository()
        {
            if (!BsonClassMap.IsClassMapRegistered(typeof(TransactionEntity)))
            {
                BsonClassMap.RegisterClassMap<TransactionEntity>(cm =>
                {
                    cm.AutoMap();
                    cm.MapIdMember(t => t.Id)
                      .SetIdGenerator(StringObjectIdGenerator.Instance)
                      .SetSerializer(new StringSerializer(BsonType.ObjectId));
                    cm.MapMember(t => t.PayerPersonId).SetElementName("payerPersonId");
                    cm.MapMember(t => t.PayeePersonId).SetElementName("payeePersonId");
                    cm.MapMember(t => t.CreatedByPersonId).SetElementName("createdByPersonId");
                    cm.MapMember(t => t.Amount).SetElementName("amount");
                    cm.MapMember(t => t.CurrencyCode).SetElementName("currencyCode");
                    cm.MapMember(t => t.TransactionDateUtc).SetElementName("transactionDateUtc");
                    cm.MapMember(t => t.Description).SetElementName("description");
                    cm.MapMember(t => t.Category).SetElementName("category");
                    cm.MapMember(t => t.Status)
                        .SetElementName("status")
                        .SetSerializer(new EnumSerializer<TransactionStatus>(BsonType.String));
                    cm.MapMember(t => t.CreatedAtUtc).SetElementName("createdAtUtc");
                    cm.MapMember(t => t.UpdatedAtUtc).SetElementName("updatedAtUtc");
                });
            }
        }

        public TransactionRepository(IOptions<FoTestDatabaseSettings> foTestDatabaseSettings)
        {
            var mongoClient = new MongoClient(foTestDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(foTestDatabaseSettings.Value.DatabaseName);
            _transactionsCollection = mongoDatabase.GetCollection<TransactionEntity>(foTestDatabaseSettings.Value.TransactionsCollectionName);
        }

        internal TransactionRepository(IMongoCollection<TransactionEntity> collection)
        {
            _transactionsCollection = collection;
        }

        public async Task<TransactionEntity?> GetByIdAsync(string id)
        {
            return await _transactionsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<TransactionEntity>> GetByInvolvedPersonIdAsync(string personId)
        {
            var filter = BuildInvolvementFilter(personId);
            return await _transactionsCollection.Find(filter).SortByDescending(t => t.TransactionDateUtc).ToListAsync();
        }

        public async Task<List<TransactionEntity>> SearchByInvolvedPersonIdAsync(string personId, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetByInvolvedPersonIdAsync(personId);
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");
            var builder = Builders<TransactionEntity>.Filter;
            var involvementFilter = BuildInvolvementFilter(personId);
            var searchFilter = builder.Regex(t => t.Description, regex) | builder.Regex(t => t.Category, regex);

            return await _transactionsCollection
                .Find(builder.And(involvementFilter, searchFilter))
                .SortByDescending(t => t.TransactionDateUtc)
                .ToListAsync();
        }

        public async Task<TransactionEntity> AddAsync(TransactionEntity transaction)
        {
            await _transactionsCollection.InsertOneAsync(transaction);
            return transaction;
        }

        public async Task UpdateAsync(string id, TransactionEntity transaction)
        {
            await _transactionsCollection.ReplaceOneAsync(x => x.Id == id, transaction);
        }

        public async Task DeleteAsync(string id)
        {
            await _transactionsCollection.DeleteOneAsync(x => x.Id == id);
        }

        private static FilterDefinition<TransactionEntity> BuildInvolvementFilter(string personId)
        {
            var builder = Builders<TransactionEntity>.Filter;
            return builder.Eq(t => t.PayerPersonId, personId) | builder.Eq(t => t.PayeePersonId, personId);
        }
    }
}
