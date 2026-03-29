using FoTestApi.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace FoTestApi.Services
{
    public class PersonService
    {
        private readonly IMongoCollection<Person> _personsCollection;

        public PersonService(IOptions<FoTestDatabaseSettings> foTestDatabaseSettings)
        {
            var mongoClient = new MongoClient(foTestDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(foTestDatabaseSettings.Value.DatabaseName);
            _personsCollection = mongoDatabase.GetCollection<Person>(foTestDatabaseSettings.Value.PersonsCollectionName);
        }

        public async Task<List<Person>> GetAsync() =>
            await _personsCollection.Find(_ => true).ToListAsync();

        public async Task<Person?> GetAsync(string id) =>
            await _personsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<List<Person>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAsync();
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");

            var builder = Builders<Person>.Filter;
            var filter = builder.Regex(p => p.FirstName, regex) | builder.Regex(p => p.LastName, regex);

            return await _personsCollection.Find(filter).ToListAsync();
        }

        public async Task CreateAsync(Person newPerson) =>
            await _personsCollection.InsertOneAsync(newPerson);

        public async Task UpdateAsync(string id, Person updatedPerson) =>
            await _personsCollection.ReplaceOneAsync(x => x.Id == id, updatedPerson);

        public async Task RemoveAsync(string id) =>
            await _personsCollection.DeleteOneAsync(x => x.Id == id);
    }
}