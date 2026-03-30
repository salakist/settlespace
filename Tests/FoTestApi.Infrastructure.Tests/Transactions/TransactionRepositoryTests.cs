using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Infrastructure.Transactions;
using Moq;
using MongoDB.Driver;

namespace FoTestApi.Infrastructure.Tests.Transactions;

public class TransactionRepositoryTests
{
    private static IAsyncCursor<Transaction> BuildCursor(IEnumerable<Transaction> items)
    {
        var list = items.ToList();
        var cursor = new Mock<IAsyncCursor<Transaction>>();

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

    private static Mock<IMongoCollection<Transaction>> BuildCollectionMock(IEnumerable<Transaction> findResults)
    {
        var mock = new Mock<IMongoCollection<Transaction>>();
        mock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Transaction>>(),
                It.IsAny<FindOptions<Transaction, Transaction>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCursor(findResults));
        return mock;
    }

    [Fact]
    public async Task GetByIdAsyncExistingTransactionReturnsTransaction()
    {
        var tx = BuildTransaction("tx-1");
        var repo = new TransactionRepository(BuildCollectionMock(new[] { tx }).Object);

        var result = await repo.GetByIdAsync("tx-1");

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetByInvolvedPersonIdAsyncReturnsTransactions()
    {
        var tx = BuildTransaction("tx-1");
        var repo = new TransactionRepository(BuildCollectionMock(new[] { tx }).Object);

        var result = await repo.GetByInvolvedPersonIdAsync("user-1");

        Assert.Single(result);
    }

    [Fact]
    public async Task AddAsyncInsertsTransactionAndReturnsIt()
    {
        var tx = BuildTransaction(null);
        var mock = new Mock<IMongoCollection<Transaction>>();
        mock.Setup(c => c.InsertOneAsync(
                tx,
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var repo = new TransactionRepository(mock.Object);
        var result = await repo.AddAsync(tx);

        Assert.Same(tx, result);
    }

    [Fact]
    public async Task SearchByInvolvedPersonIdAsyncEmptyQueryReturnsInvolvedTransactions()
    {
        var tx = BuildTransaction("tx-1");
        var repo = new TransactionRepository(BuildCollectionMock(new[] { tx }).Object);

        var result = await repo.SearchByInvolvedPersonIdAsync("user-1", string.Empty);

        Assert.Single(result);
    }

    [Fact]
    public async Task UpdateAsyncCallsReplaceOne()
    {
        var tx = BuildTransaction("tx-1");
        var mock = new Mock<IMongoCollection<Transaction>>();
        mock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Transaction>>(),
                tx,
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<ReplaceOneResult>());

        var repo = new TransactionRepository(mock.Object);
        await repo.UpdateAsync("tx-1", tx);

        mock.Verify(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<Transaction>>(),
            tx,
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsyncCallsDeleteOne()
    {
        var mock = new Mock<IMongoCollection<Transaction>>();
        mock.Setup(c => c.DeleteOneAsync(
                It.IsAny<FilterDefinition<Transaction>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<DeleteResult>());

        var repo = new TransactionRepository(mock.Object);
        await repo.DeleteAsync("tx-1");

        mock.Verify(c => c.DeleteOneAsync(
            It.IsAny<FilterDefinition<Transaction>>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Transaction BuildTransaction(string? id) =>
        new()
        {
            Id = id,
            PayerPersonId = "user-1",
            PayeePersonId = "user-2",
            CreatedByPersonId = "user-1",
            Amount = 12m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Shared taxi",
            Status = TransactionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}



