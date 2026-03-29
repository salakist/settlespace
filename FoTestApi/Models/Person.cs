using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FoTestApi.Models
{
    /// <summary>
    /// Represents a person with first and last names.
    /// </summary>
    public class Person
    {
        /// <summary>
        /// The unique identifier for the person.
        /// </summary>
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        /// <summary>
        /// The first name of the person.
        /// </summary>
        [BsonElement("firstName")]
        public string FirstName { get; set; } = null!;

        /// <summary>
        /// The last name of the person.
        /// </summary>
        [BsonElement("lastName")]
        public string LastName { get; set; } = null!;
    }
}