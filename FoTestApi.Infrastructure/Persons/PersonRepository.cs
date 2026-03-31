using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Persons;
using FoTestApi.Infrastructure.Serialization;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace FoTestApi.Infrastructure.Persons
{
    /// <summary>
    /// MongoDB implementation of the IPersonRepository.
    /// Handles all persistence operations for Person.
    /// Registers Bson mapping here to keep the Domain layer persistence-agnostic.
    /// </summary>
    public class PersonRepository : IPersonRepository
    {
        private readonly IMongoCollection<Person> _personsCollection;

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

            if (!BsonClassMap.IsClassMapRegistered(typeof(Person)))
            {
                BsonClassMap.RegisterClassMap<Person>(cm =>
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
                    cm.MapMember(p => p.Role)
                        .SetElementName("role")
                        .SetIsRequired(true)
                        .SetSerializer(new EnumSerializer<PersonRole>(BsonType.String));
                    cm.MapMember(p => p.Addresses).SetElementName("addresses");
                });
            }
        }

        public PersonRepository(IOptions<FoTestDatabaseSettings> foTestDatabaseSettings)
        {
            var mongoClient = new MongoClient(foTestDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(foTestDatabaseSettings.Value.DatabaseName);
            _personsCollection = mongoDatabase.GetCollection<Person>(foTestDatabaseSettings.Value.PersonsCollectionName);
        }

        /// <summary>
        /// Test-only constructor that accepts a mock collection directly.
        /// </summary>
        internal PersonRepository(IMongoCollection<Person> collection)
        {
            _personsCollection = collection;
        }

        public async Task<List<Person>> GetAllAsync()
        {
            return await _personsCollection.Find(_ => true).ToListAsync();
        }

        public async Task<Person?> GetByIdAsync(string id)
        {
            return await _personsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Person>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllAsync();
            }

            var escapedQuery = Regex.Escape(query.Trim());
            var regex = new BsonRegularExpression($".*{escapedQuery}.*", "i");

            var builder = Builders<Person>.Filter;
            var filter = builder.Regex(p => p.FirstName, regex) | builder.Regex(p => p.LastName, regex);

            return await _personsCollection.Find(filter).ToListAsync();
        }

        public async Task<Person?> FindByFullNameAsync(string firstName, string lastName)
        {
            var builder = Builders<Person>.Filter;
            var filter = builder.Regex(p => p.FirstName, new BsonRegularExpression($"^{Regex.Escape(firstName)}$", "i")) &
                         builder.Regex(p => p.LastName, new BsonRegularExpression($"^{Regex.Escape(lastName)}$", "i"));

            return await _personsCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Person> AddAsync(Person person)
        {
            await _personsCollection.InsertOneAsync(person);
            return person;
        }

        public async Task UpdateAsync(string id, Person person)
        {
            await _personsCollection.ReplaceOneAsync(x => x.Id == id, person);
        }

        public async Task DeleteAsync(string id)
        {
            await _personsCollection.DeleteOneAsync(x => x.Id == id);
        }
    }
}



