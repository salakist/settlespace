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
    /// <summary>
    /// MongoDB implementation of the IPersonRepository.
    /// Handles all persistence operations for PersonEntity.
    /// Registers Bson mapping here to keep the Domain layer persistence-agnostic.
    /// </summary>
    public class PersonRepository : IPersonRepository
    {
        private readonly IMongoCollection<PersonEntity> _personsCollection;

        static PersonRepository()
        {
            if (!BsonClassMap.IsClassMapRegistered(typeof(PersonEntity)))
            {
                BsonClassMap.RegisterClassMap<PersonEntity>(cm =>
                {
                    cm.AutoMap();
                    cm.MapIdMember(p => p.Id)
                      .SetIdGenerator(StringObjectIdGenerator.Instance)
                      .SetSerializer(new StringSerializer(BsonType.ObjectId));
                    cm.MapMember(p => p.FirstName).SetElementName("firstName");
                    cm.MapMember(p => p.LastName).SetElementName("lastName");
                });
            }
        }

        public PersonRepository(IOptions<FoTestDatabaseSettings> foTestDatabaseSettings)
        {
            var mongoClient = new MongoClient(foTestDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(foTestDatabaseSettings.Value.DatabaseName);
            _personsCollection = mongoDatabase.GetCollection<PersonEntity>(foTestDatabaseSettings.Value.PersonsCollectionName);
        }

        public async Task<List<PersonEntity>> GetAllAsync()
        {
            return await _personsCollection.Find(_ => true).ToListAsync();
        }

        public async Task<PersonEntity?> GetByIdAsync(string id)
        {
            return await _personsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<PersonEntity>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllAsync();
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");

            var builder = Builders<PersonEntity>.Filter;
            var filter = builder.Regex(p => p.FirstName, regex) | builder.Regex(p => p.LastName, regex);

            return await _personsCollection.Find(filter).ToListAsync();
        }

        public async Task<PersonEntity?> FindByFullNameAsync(string firstName, string lastName)
        {
            var builder = Builders<PersonEntity>.Filter;
            var filter = builder.Regex(p => p.FirstName, new BsonRegularExpression($"^{Regex.Escape(firstName)}$", "i")) &
                         builder.Regex(p => p.LastName, new BsonRegularExpression($"^{Regex.Escape(lastName)}$", "i"));

            return await _personsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<PersonEntity> AddAsync(PersonEntity person)
        {
            await _personsCollection.InsertOneAsync(person);
            return person;
        }

        public async Task UpdateAsync(string id, PersonEntity person)
        {
            await _personsCollection.ReplaceOneAsync(x => x.Id == id, person);
        }

        public async Task DeleteAsync(string id)
        {
            await _personsCollection.DeleteOneAsync(x => x.Id == id);
        }
    }
}
