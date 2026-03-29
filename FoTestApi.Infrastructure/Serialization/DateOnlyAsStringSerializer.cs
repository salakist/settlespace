using System.Globalization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

namespace FoTestApi.Infrastructure.Serialization
{
    /// <summary>
    /// Persists DateOnly values as yyyy-MM-dd strings.
    /// </summary>
    public sealed class DateOnlyAsStringSerializer : SerializerBase<DateOnly>
    {
        private const string DateFormat = "yyyy-MM-dd";

        public override DateOnly Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
        {
            var bsonType = context.Reader.GetCurrentBsonType();

            return bsonType switch
            {
                BsonType.String => DateOnly.ParseExact(context.Reader.ReadString(), DateFormat, CultureInfo.InvariantCulture),
                _ => throw new FormatException($"Cannot deserialize DateOnly from BSON type {bsonType}.")
            };
        }

        public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, DateOnly value)
        {
            context.Writer.WriteString(value.ToString(DateFormat, CultureInfo.InvariantCulture));
        }
    }
}
