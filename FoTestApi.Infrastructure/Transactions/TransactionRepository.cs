using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Domain.Transactions;
using FoTestApi.Infrastructure;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace FoTestApi.Infrastructure.Transactions
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly IMongoCollection<Transaction> _transactionsCollection;

        static TransactionRepository()
        {
            if (!BsonClassMap.IsClassMapRegistered(typeof(Transaction)))
            {
                BsonClassMap.RegisterClassMap<Transaction>(cm =>
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
            _transactionsCollection = mongoDatabase.GetCollection<Transaction>(foTestDatabaseSettings.Value.TransactionsCollectionName);
        }

        internal TransactionRepository(IMongoCollection<Transaction> collection)
        {
            _transactionsCollection = collection;
        }

        public async Task<Transaction?> GetByIdAsync(string id)
        {
            return await _transactionsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Transaction>> GetAllAsync()
        {
            return await _transactionsCollection
                .Find(_ => true)
                .SortByDescending(t => t.TransactionDateUtc)
                .ToListAsync();
        }

        public async Task<List<Transaction>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllAsync();
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");
            var builder = Builders<Transaction>.Filter;
            var searchFilter = builder.Regex(t => t.Description, regex) | builder.Regex(t => t.Category, regex);

            return await _transactionsCollection
                .Find(searchFilter)
                .SortByDescending(t => t.TransactionDateUtc)
                .ToListAsync();
        }

        public async Task<List<Transaction>> GetByInvolvedPersonIdAsync(string personId)
        {
            var filter = BuildInvolvementFilter(personId);
            return await _transactionsCollection.Find(filter).SortByDescending(t => t.TransactionDateUtc).ToListAsync();
        }

        public async Task<List<Transaction>> SearchByInvolvedPersonIdAsync(string personId, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetByInvolvedPersonIdAsync(personId);
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");
            var builder = Builders<Transaction>.Filter;
            var involvementFilter = BuildInvolvementFilter(personId);
            var searchFilter = builder.Regex(t => t.Description, regex) | builder.Regex(t => t.Category, regex);

            return await _transactionsCollection
                .Find(builder.And(involvementFilter, searchFilter))
                .SortByDescending(t => t.TransactionDateUtc)
                .ToListAsync();
        }

        public async Task<Transaction> AddAsync(Transaction transaction)
        {
            await _transactionsCollection.InsertOneAsync(transaction);
            return transaction;
        }

        public async Task UpdateAsync(string id, Transaction transaction)
        {
            await _transactionsCollection.ReplaceOneAsync(x => x.Id == id, transaction);
        }

        public async Task DeleteAsync(string id)
        {
            await _transactionsCollection.DeleteOneAsync(x => x.Id == id);
        }

        private static FilterDefinition<Transaction> BuildInvolvementFilter(string personId)
        {
            var builder = Builders<Transaction>.Filter;
            return builder.Eq(t => t.PayerPersonId, personId) | builder.Eq(t => t.PayeePersonId, personId);
        }
    }
}



