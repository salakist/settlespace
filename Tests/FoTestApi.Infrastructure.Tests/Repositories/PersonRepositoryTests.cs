using FoTestApi.Domain.Entities;
using FoTestApi.Infrastructure.Repositories;
using Moq;
using MongoDB.Driver;

namespace FoTestApi.Infrastructure.Tests.Repositories;

public class PersonRepositoryTests
{
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Builds a mock IAsyncCursor that returns <paramref name="items"/> on the
    /// first MoveNextAsync call, then false on subsequent calls.
    /// </summary>
    private static IAsyncCursor<PersonEntity> BuildCursor(IEnumerable<PersonEntity> items)
    {
        var list = items.ToList();
        var cursor = new Mock<IAsyncCursor<PersonEntity>>();

        if (list.Count > 0)
        {
            cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                  .ReturnsAsync(true)
                  .ReturnsAsync(false);
            cursor.Setup(c => c.Current).Returns(list);
        }
        else
        {
            cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                  .ReturnsAsync(false);
        }

        return cursor.Object;
    }

    /// <summary>
    /// Creates a mock collection where FindAsync returns the supplied items.
    /// </summary>
    private static Mock<IMongoCollection<PersonEntity>> BuildCollectionMock(
        IEnumerable<PersonEntity> findResults)
    {
        var mock = new Mock<IMongoCollection<PersonEntity>>();
        mock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<PersonEntity>>(),
                It.IsAny<FindOptions<PersonEntity, PersonEntity>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCursor(findResults));
        return mock;
    }

    private static PersonRepository CreateRepo(IMongoCollection<PersonEntity> collection)
        => new(collection);

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    /// <summary>Gets all persons returns all persons from repository.</summary>
    [Fact]
    public async Task GetAllAsyncReturnsAllPersons()
    {
        var persons = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" },
            new() { Id = "2", FirstName = "Jane", LastName = "Smith" }
        };
        var repo = CreateRepo(BuildCollectionMock(persons).Object);

        var result = await repo.GetAllAsync();

        Assert.Equal(2, result.Count);
        Assert.Equal("John", result[0].FirstName);
    }

    /// <summary>Gets person by id with existing person returns the person.</summary>
    [Fact]
    public async Task GetByIdAsyncExistingPersonReturnsPerson()
    {
        var person = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };
        var repo = CreateRepo(BuildCollectionMock(new[] { person }).Object);

        var result = await repo.GetByIdAsync("1");

        Assert.NotNull(result);
        Assert.Equal("John", result.FirstName);
    }

    /// <summary>Gets person by id with unknown id returns null.</summary>
    [Fact]
    public async Task GetByIdAsyncUnknownIdReturnsNull()
    {
        var repo = CreateRepo(BuildCollectionMock(Enumerable.Empty<PersonEntity>()).Object);

        var result = await repo.GetByIdAsync("nonexistent");

        Assert.Null(result);
    }

    /// <summary>Searches with empty query returns all persons.</summary>
    [Fact]
    public async Task SearchAsyncEmptyQueryReturnsAllPersons()
    {
        var persons = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" },
            new() { Id = "2", FirstName = "Jane", LastName = "Smith" }
        };
        var repo = CreateRepo(BuildCollectionMock(persons).Object);

        var result = await repo.SearchAsync(string.Empty);

        Assert.Equal(2, result.Count);
    }

    /// <summary>Searches with valid query returns filtered results.</summary>
    [Fact]
    public async Task SearchAsyncValidQueryReturnsFilteredResults()
    {
        var matching = new List<PersonEntity>
        {
            new() { Id = "1", FirstName = "John", LastName = "Doe" }
        };
        var repo = CreateRepo(BuildCollectionMock(matching).Object);

        var result = await repo.SearchAsync("John");

        Assert.Single(result);
        Assert.Equal("John", result[0].FirstName);
    }

    /// <summary>Finds person by full name with existing person returns the person.</summary>
    [Fact]
    public async Task FindByFullNameAsyncExistingPersonReturnsPerson()
    {
        var person = new PersonEntity { Id = "1", FirstName = "John", LastName = "Doe" };
        var repo = CreateRepo(BuildCollectionMock(new[] { person }).Object);

        var result = await repo.FindByFullNameAsync("John", "Doe");

        Assert.NotNull(result);
        Assert.Equal("Doe", result.LastName);
    }

    /// <summary>Finds person by full name with no person found returns null.</summary>
    [Fact]
    public async Task FindByFullNameAsyncNoPersonReturnsNull()
    {
        var repo = CreateRepo(BuildCollectionMock(Enumerable.Empty<PersonEntity>()).Object);

        var result = await repo.FindByFullNameAsync("Nobody", "Here");

        Assert.Null(result);
    }

    /// <summary>Adds async inserts person and returns it.</summary>
    [Fact]
    public async Task AddAsyncInsertsPersonAndReturnsIt()
    {
        var person = new PersonEntity { FirstName = "New", LastName = "Person" };
        var mock = new Mock<IMongoCollection<PersonEntity>>();
        mock.Setup(c => c.InsertOneAsync(
                person,
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var repo = CreateRepo(mock.Object);
        var result = await repo.AddAsync(person);

        Assert.Same(person, result);
        mock.Verify(c => c.InsertOneAsync(
            person,
            It.IsAny<InsertOneOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>Updates async calls replace one.</summary>
    [Fact]
    public async Task UpdateAsyncCallsReplaceOne()
    {
        var person = new PersonEntity { Id = "1", FirstName = "Updated", LastName = "Name" };
        var mock = new Mock<IMongoCollection<PersonEntity>>();
        mock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<PersonEntity>>(),
                person,
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<ReplaceOneResult>());

        var repo = CreateRepo(mock.Object);
        await repo.UpdateAsync("1", person);

        mock.Verify(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<PersonEntity>>(),
            person,
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>Deletes async calls delete one.</summary>
    [Fact]
    public async Task DeleteAsyncCallsDeleteOne()
    {
        var mock = new Mock<IMongoCollection<PersonEntity>>();
        mock.Setup(c => c.DeleteOneAsync(
                It.IsAny<FilterDefinition<PersonEntity>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<DeleteResult>());

        var repo = CreateRepo(mock.Object);
        await repo.DeleteAsync("1");

        mock.Verify(c => c.DeleteOneAsync(
            It.IsAny<FilterDefinition<PersonEntity>>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
