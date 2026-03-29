using FoTestApi.Infrastructure.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;

namespace FoTestApi.Infrastructure.Tests.Serialization;

public class DateOnlyAsStringSerializerTests
{
    private readonly DateOnlyAsStringSerializer _sut = new();

    [Fact]
    public void SerializeWritesDateOnlyAsIsoString()
    {
        var document = new BsonDocument();
        using var writer = new BsonDocumentWriter(document);

        writer.WriteStartDocument();
        writer.WriteName("value");
        var context = BsonSerializationContext.CreateRoot(writer);

        _sut.Serialize(context, default, new DateOnly(2024, 2, 29));

        writer.WriteEndDocument();

        Assert.Equal("2024-02-29", document["value"].AsString);
    }

    [Fact]
    public void DeserializeReadsDateOnlyFromIsoString()
    {
        var document = new BsonDocument("value", "2024-02-29");
        using var reader = new BsonDocumentReader(document);

        reader.ReadStartDocument();
        reader.ReadName("value");
        var context = BsonDeserializationContext.CreateRoot(reader);

        var result = _sut.Deserialize(context, default);

        reader.ReadEndDocument();

        Assert.Equal(new DateOnly(2024, 2, 29), result);
    }

    [Fact]
    public void DeserializeWithNonStringValueThrowsFormatException()
    {
        var document = new BsonDocument("value", 42);
        using var reader = new BsonDocumentReader(document);

        reader.ReadStartDocument();
        reader.ReadName("value");
        var context = BsonDeserializationContext.CreateRoot(reader);

        Assert.Throws<FormatException>(() => _sut.Deserialize(context, default));
    }
}