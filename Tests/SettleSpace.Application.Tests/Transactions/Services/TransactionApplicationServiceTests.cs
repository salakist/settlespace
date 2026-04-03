using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Application.Transactions.Services;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions.Services;
using Moq;

namespace SettleSpace.Application.Tests.Transactions.Services;

public class TransactionApplicationServiceTests
{
    private readonly Mock<IPersonRepository> _personRepositoryMock = new();
    private readonly Mock<ITransactionRepository> _repositoryMock = new();
    private readonly Mock<ITransactionDomainService> _domainServiceMock = new();
    private readonly ITransactionMapper _mapper = new TransactionMapper();
    private readonly TransactionApplicationService _sut;

    public TransactionApplicationServiceTests()
    {
        _sut = new TransactionApplicationService(_personRepositoryMock.Object, _repositoryMock.Object, _domainServiceMock.Object, _mapper);
    }

    [Fact]
    public async Task GetCurrentUserTransactionsAsyncReturnsRepositoryResults()
    {
        var transactions = new List<Transaction> { BuildTransaction("tx-1") };
        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(transactions);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(transactions, "user-1", PersonRole.USER))
            .Returns(transactions);

        var result = await _sut.GetCurrentUserTransactionsAsync("user-1", PersonRole.USER);

        Assert.Single(result);
    }

    [Fact]
    public async Task CreateTransactionAsyncValidCommandAddsTransaction()
    {
        var command = new CreateTransactionCommand
        {
            PayerPersonId = "user-1",
            PayeePersonId = "user-2",
            Amount = 10m,
            CurrencyCode = "eur",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Lunch",
            Status = TransactionStatus.Completed,
        };

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Transaction>()))
            .ReturnsAsync((Transaction tx) => tx);

        var result = await _sut.CreateTransactionAsync("user-1", PersonRole.USER, command);

        _domainServiceMock.Verify(d => d.EnsureCanCreate(It.IsAny<Transaction>(), "user-1", PersonRole.USER), Times.Once);
        Assert.Equal("EUR", result.CurrencyCode);
    }

    [Fact]
    public async Task GetTransactionByIdAsyncMissingTransactionThrowsTransactionNotFoundException()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Transaction?)null);

        await Assert.ThrowsAsync<TransactionNotFoundException>(() => _sut.GetTransactionByIdAsync("missing", "user-1", PersonRole.USER));
    }

    [Fact]
    public async Task DeleteTransactionAsyncValidRequestDeletes()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync("tx-1")).ReturnsAsync(BuildTransaction("tx-1"));
        _repositoryMock.Setup(r => r.DeleteAsync("tx-1")).Returns(Task.CompletedTask);

        await _sut.DeleteTransactionAsync("tx-1", "user-1", PersonRole.USER);

        _domainServiceMock.Verify(d => d.EnsureCanDelete(It.IsAny<Transaction>(), "user-1", PersonRole.USER), Times.Once);
        _repositoryMock.Verify(r => r.DeleteAsync("tx-1"), Times.Once);
    }

    [Fact]
    public async Task SearchCurrentUserTransactionsAsyncDelegatesToRepository()
    {
        _personRepositoryMock.Setup(r => r.SearchAsync("taxi")).ReturnsAsync([]);
        _repositoryMock.Setup(r => r.SearchAsync("taxi"))
            .ReturnsAsync(new List<Transaction> { BuildTransaction("tx-1") });
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchCurrentUserTransactionsAsync("user-1", PersonRole.USER, "taxi");

        Assert.Single(result);
    }

    [Fact]
    public async Task SearchCurrentUserTransactionsAsyncIncludesTransactionsMatchingInvolvedPersonNames()
    {
        var matchingTransaction = BuildTransaction("tx-1");
        var nonMatchingTransaction = BuildTransaction("tx-2");
        nonMatchingTransaction.PayerPersonId = "user-3";
        nonMatchingTransaction.PayeePersonId = "user-4";

        _personRepositoryMock.Setup(r => r.SearchAsync("john"))
            .ReturnsAsync([
                new Person
                {
                    Id = "user-1",
                    FirstName = "John",
                    LastName = "Doe",
                    Password = "hashed"
                }
            ]);
        _repositoryMock.Setup(r => r.SearchAsync("john")).ReturnsAsync([]);
        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync([matchingTransaction, nonMatchingTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchCurrentUserTransactionsAsync("user-1", PersonRole.USER, "john");

        Assert.Single(result);
        Assert.Equal("tx-1", result[0].Id);
    }

    [Fact]
    public async Task UpdateTransactionAsyncValidRequestUpdates()
    {
        var existing = BuildTransaction("tx-1");
        var command = new UpdateTransactionCommand
        {
            PayerPersonId = "user-1",
            PayeePersonId = "user-2",
            Amount = 21m,
            CurrencyCode = "usd",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Updated",
            Status = TransactionStatus.Pending,
        };

        _repositoryMock.Setup(r => r.GetByIdAsync("tx-1")).ReturnsAsync(existing);
        _repositoryMock.Setup(r => r.UpdateAsync("tx-1", It.IsAny<Transaction>())).Returns(Task.CompletedTask);

        await _sut.UpdateTransactionAsync("tx-1", "user-1", PersonRole.USER, command);

        _repositoryMock.Verify(r => r.UpdateAsync("tx-1", It.Is<Transaction>(t => t.CurrencyCode == "USD")), Times.Once);
    }

    [Fact]
    public async Task GetCurrentUserTransactionsAsyncMissingUserThrowsUnauthorizedTransactionAccessException()
    {
        _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Transaction>());
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(
                It.IsAny<IEnumerable<Transaction>>(),
                It.Is<string>(personId => string.IsNullOrWhiteSpace(personId)),
                PersonRole.USER))
            .Throws(new UnauthorizedTransactionAccessException("Authenticated user identifier is required."));

        await Assert.ThrowsAsync<UnauthorizedTransactionAccessException>(() => _sut.GetCurrentUserTransactionsAsync(" ", PersonRole.USER));
    }

    private static Transaction BuildTransaction(string id) =>
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



