using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace SettleSpace.Infrastructure.Transactions
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

        public TransactionRepository(IOptions<SettleSpaceDatabaseSettings> databaseSettings)
        {
            var mongoClient = new MongoClient(databaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(databaseSettings.Value.DatabaseName);
            _transactionsCollection = mongoDatabase.GetCollection<Transaction>(databaseSettings.Value.TransactionsCollectionName);
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

        public async Task<List<Transaction>> SearchAsync(TransactionSearchFilter filter)
        {
            var builder = Builders<Transaction>.Filter;
            var composedFilter = BuildSearchFilter(filter, builder);

            return await _transactionsCollection
                .Find(composedFilter)
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

        private static FilterDefinition<Transaction> BuildSearchFilter(
            TransactionSearchFilter filter,
            FilterDefinitionBuilder<Transaction> builder)
        {
            var conditions = new List<FilterDefinition<Transaction>>();

            if (!string.IsNullOrWhiteSpace(filter.FreeText))
            {
                var escapedText = Regex.Escape(filter.FreeText.Trim());
                var regex = new BsonRegularExpression($".*{escapedText}.*", "i");
                conditions.Add(builder.Regex(t => t.Description, regex) | builder.Regex(t => t.Category, regex));
            }

            if (filter.Status is { Count: > 0 })
            {
                conditions.Add(builder.In(t => t.Status, filter.Status));
            }

            if (!string.IsNullOrWhiteSpace(filter.Category))
            {
                var escapedCategory = Regex.Escape(filter.Category.Trim());
                var categoryRegex = new BsonRegularExpression($".*{escapedCategory}.*", "i");
                conditions.Add(builder.Regex(t => t.Category, categoryRegex));
            }

            if (!string.IsNullOrWhiteSpace(filter.Description))
            {
                var escapedDescription = Regex.Escape(filter.Description.Trim());
                var descriptionRegex = new BsonRegularExpression($".*{escapedDescription}.*", "i");
                conditions.Add(builder.Regex(t => t.Description, descriptionRegex));
            }

            if (filter.Involved is { Count: > 0 })
            {
                conditions.Add(
                    builder.In(t => t.PayerPersonId, filter.Involved) |
                    builder.In(t => t.PayeePersonId, filter.Involved));
            }

            if (filter.ManagedBy is { Count: > 0 })
            {
                conditions.Add(builder.In(t => t.CreatedByPersonId, filter.ManagedBy));
            }

            if (!string.IsNullOrWhiteSpace(filter.Payer))
            {
                conditions.Add(builder.Eq(t => t.PayerPersonId, filter.Payer));
            }

            if (!string.IsNullOrWhiteSpace(filter.Payee))
            {
                conditions.Add(builder.Eq(t => t.PayeePersonId, filter.Payee));
            }

            return conditions.Count == 0
                ? builder.Empty
                : builder.And(conditions);
        }
    }
}



