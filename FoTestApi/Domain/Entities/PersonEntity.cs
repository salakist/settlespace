using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FoTestApi.Domain.Entities
{
    /// <summary>
    /// PersonEntity is the aggregate root for the Person domain.
    /// It encapsulates the business rules and invariants for persons.
    /// </summary>
    public class PersonEntity
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

        /// <summary>
        /// Validates that the person has non-empty first and last names.
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown when names are null or empty.</exception>
        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(FirstName))
                throw new InvalidOperationException("FirstName cannot be empty.");

            if (string.IsNullOrWhiteSpace(LastName))
                throw new InvalidOperationException("LastName cannot be empty.");
        }

        /// <summary>
        /// Checks if this person matches another by case-insensitive full name comparison.
        /// </summary>
        public bool MatchesByFullName(PersonEntity other)
        {
            return string.Equals(FirstName, other.FirstName, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(LastName, other.LastName, StringComparison.OrdinalIgnoreCase);
        }
    }
}
