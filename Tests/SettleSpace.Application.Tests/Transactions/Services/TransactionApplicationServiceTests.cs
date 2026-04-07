using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
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
    private readonly TransactionDomainService _realDomainService = new();

    public TransactionApplicationServiceTests()
    {
        _sut = new TransactionApplicationService(_personRepositoryMock.Object, _repositoryMock.Object, _domainServiceMock.Object, _mapper);
        _domainServiceMock
            .Setup(d => d.FilterByManagedBy(It.IsAny<List<Transaction>>(), It.IsAny<List<string>>()))
            .Returns((List<Transaction> t, List<string>? m) => _realDomainService.FilterByManagedBy(t, m));
        _domainServiceMock
            .Setup(d => d.FilterByInvolvement(It.IsAny<List<Transaction>>(), It.IsAny<string>(), It.IsAny<InvolvementType?>()))
            .Returns((List<Transaction> t, string id, InvolvementType? inv) => _realDomainService.FilterByInvolvement(t, id, inv));
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
    public async Task SearchTransactionsAsyncWithFreeTextDelegatesToRepository()
    {
        var query = new TransactionSearchQuery { FreeText = "taxi" };
        _personRepositoryMock.Setup(r => r.SearchAsync("taxi")).ReturnsAsync([]);
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.FreeText == "taxi")))
            .ReturnsAsync(new List<Transaction> { BuildTransaction("tx-1") });
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithNullFreeTextReturnsAllReadable()
    {
        var query = new TransactionSearchQuery();
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.FreeText == null)))
            .ReturnsAsync(new List<Transaction> { BuildTransaction("tx-1") });
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithFreeTextIncludesPersonNameMatches()
    {
        var query = new TransactionSearchQuery { FreeText = "john" };
        var matchingTransaction = BuildTransaction("tx-1");

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
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.FreeText == "john")))
            .ReturnsAsync([]);
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.FreeText == null)))
            .ReturnsAsync([matchingTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        Assert.Equal("tx-1", result[0].Id);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithOwnedInvolvementReturnsOnlyInvolvedTransactions()
    {
        var ownedTransaction = BuildTransaction("tx-owned");
        var managedTransaction = BuildTransaction("tx-managed");
        managedTransaction.PayerPersonId = "user-3";
        managedTransaction.PayeePersonId = "user-4";
        managedTransaction.CreatedByPersonId = "user-1";

        var query = new TransactionSearchQuery { Involvement = InvolvementType.Owned };
        _repositoryMock.Setup(r => r.SearchAsync(It.IsAny<TransactionSearchFilter>()))
            .ReturnsAsync([ownedTransaction, managedTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        Assert.Equal("tx-owned", result[0].Id);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithManagedInvolvementReturnsOnlyManagedTransactions()
    {
        var ownedTransaction = BuildTransaction("tx-owned");
        var managedTransaction = BuildTransaction("tx-managed");
        managedTransaction.PayerPersonId = "user-3";
        managedTransaction.PayeePersonId = "user-4";
        managedTransaction.CreatedByPersonId = "user-1";

        var query = new TransactionSearchQuery { Involvement = InvolvementType.Managed };
        _repositoryMock.Setup(r => r.SearchAsync(It.IsAny<TransactionSearchFilter>()))
            .ReturnsAsync([ownedTransaction, managedTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        Assert.Equal("tx-managed", result[0].Id);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithNoInvolvementReturnsAll()
    {
        var ownedTransaction = BuildTransaction("tx-owned");
        var managedTransaction = BuildTransaction("tx-managed");
        managedTransaction.PayerPersonId = "user-3";
        managedTransaction.PayeePersonId = "user-4";
        managedTransaction.CreatedByPersonId = "user-1";

        var query = new TransactionSearchQuery();
        _repositoryMock.Setup(r => r.SearchAsync(It.IsAny<TransactionSearchFilter>()))
            .ReturnsAsync([ownedTransaction, managedTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesCategoryToFilter()
    {
        var query = new TransactionSearchQuery { Category = "food" };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Category == "food")))
            .ReturnsAsync([BuildTransaction("tx-1")]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Category == "food")), Times.Once);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesDescriptionToFilter()
    {
        var query = new TransactionSearchQuery { Description = "taxi" };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Description == "taxi")))
            .ReturnsAsync([BuildTransaction("tx-1")]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Description == "taxi")), Times.Once);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesInvolvedToFilter()
    {
        var involved = new List<string> { "person-1", "person-2" };
        var query = new TransactionSearchQuery { Involved = involved };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Involved == involved)))
            .ReturnsAsync([BuildTransaction("tx-1")]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Involved == involved)), Times.Once);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesManagedByToFilter()
    {
        var managedTransaction = BuildTransaction("tx-1");
        managedTransaction.CreatedByPersonId = "person-1";
        managedTransaction.PayerPersonId = "payer-1";
        managedTransaction.PayeePersonId = "payee-1";

        var managedBy = new List<string> { "person-1" };
        var query = new TransactionSearchQuery { ManagedBy = managedBy };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.ManagedBy == managedBy)))
            .ReturnsAsync([managedTransaction]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.ManagedBy == managedBy)), Times.Once);
    }

    [Fact]
    public async Task SearchTransactionsAsyncWithManagedByExcludesTransactionsWhereCreatorIsAlsoInvolved()
    {
        var directlyInvolved = BuildTransaction("tx-owned");
        directlyInvolved.CreatedByPersonId = "person-1";
        directlyInvolved.PayerPersonId = "person-1";
        directlyInvolved.PayeePersonId = "person-2";

        var externallyManaged = BuildTransaction("tx-managed");
        externallyManaged.CreatedByPersonId = "person-1";
        externallyManaged.PayerPersonId = "person-3";
        externallyManaged.PayeePersonId = "person-4";

        var query = new TransactionSearchQuery { ManagedBy = ["person-1"] };
        _repositoryMock.Setup(r => r.SearchAsync(It.IsAny<TransactionSearchFilter>()))
            .ReturnsAsync([directlyInvolved, externallyManaged]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-9", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-9", PersonRole.USER, query);

        Assert.Single(result);
        Assert.Equal("tx-managed", result[0].Id);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesPayerToFilter()
    {
        var query = new TransactionSearchQuery { Payer = "person-1" };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Payer == "person-1")))
            .ReturnsAsync([BuildTransaction("tx-1")]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Payer == "person-1")), Times.Once);
    }

    [Fact]
    public async Task SearchTransactionsAsyncPassesPayeeToFilter()
    {
        var query = new TransactionSearchQuery { Payee = "person-2" };
        _repositoryMock.Setup(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Payee == "person-2")))
            .ReturnsAsync([BuildTransaction("tx-1")]);
        _domainServiceMock
            .Setup(d => d.FilterReadableTransactions(It.IsAny<IEnumerable<Transaction>>(), "user-1", PersonRole.USER))
            .Returns((IEnumerable<Transaction> transactions, string _, PersonRole _) => transactions.ToList());

        var result = await _sut.SearchTransactionsAsync("user-1", PersonRole.USER, query);

        Assert.Single(result);
        _repositoryMock.Verify(r => r.SearchAsync(It.Is<TransactionSearchFilter>(f => f.Payee == "person-2")), Times.Once);
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



