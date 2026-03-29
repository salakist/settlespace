using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Repositories;
using FoTestApi.Infrastructure;
using FoTestApi.Infrastructure.Serialization;
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
            if (!BsonClassMap.IsClassMapRegistered(typeof(Address)))
            {
                BsonClassMap.RegisterClassMap<Address>(cm =>
                {
                    cm.AutoMap();
                    cm.MapMember(p => p.Label).SetElementName("label");
                    cm.MapMember(p => p.StreetLine1).SetElementName("streetLine1");
                    cm.MapMember(p => p.StreetLine2).SetElementName("streetLine2");
                    cm.MapMember(p => p.PostalCode).SetElementName("postalCode");
                    cm.MapMember(p => p.City).SetElementName("city");
                    cm.MapMember(p => p.StateOrRegion).SetElementName("stateOrRegion");
                    cm.MapMember(p => p.Country).SetElementName("country");
                });
            }

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
                    cm.MapMember(p => p.Password).SetElementName("password");
                    cm.MapMember(p => p.PhoneNumber).SetElementName("phoneNumber");
                    cm.MapMember(p => p.Email).SetElementName("email");
                                        cm.MapMember(p => p.DateOfBirth)
                                            .SetElementName("dateOfBirth")
                                            .SetSerializer(new NullableSerializer<DateOnly>(new DateOnlyAsStringSerializer()));
                    cm.MapMember(p => p.Addresses).SetElementName("addresses");
                });
            }
        }

        public PersonRepository(IOptions<FoTestDatabaseSettings> foTestDatabaseSettings)
        {
            var mongoClient = new MongoClient(foTestDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(foTestDatabaseSettings.Value.DatabaseName);
            _personsCollection = mongoDatabase.GetCollection<PersonEntity>(foTestDatabaseSettings.Value.PersonsCollectionName);
        }

        /// <summary>
        /// Test-only constructor that accepts a mock collection directly.
        /// </summary>
        internal PersonRepository(IMongoCollection<PersonEntity> collection)
        {
            _personsCollection = collection;
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
