using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions.Services;

namespace SettleSpace.Domain.Tests.Transactions.Services;

public class TransactionDomainServiceTests
{
    private readonly TransactionDomainService _sut = new();

    [Fact]
    public void EnsureCanCreateWhenLoggedUserInvolvedDoesNotThrow()
    {
        var transaction = BuildTransaction();

        var ex = Record.Exception(() => _sut.EnsureCanCreate(transaction, "payer-1", PersonRole.USER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanCreateWhenLoggedUserNotInvolvedThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanCreate(transaction, "other", PersonRole.USER));
    }

    [Fact]
    public void EnsureCanReadWhenNotInvolvedThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanRead(transaction, "other", PersonRole.USER));
    }

    [Fact]
    public void EnsureCanDeleteWhenNotCreatorThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanDelete(transaction, "payee-1", PersonRole.USER));
    }

    [Fact]
    public void EnsureCanCreateManagerWhenNotInvolvedDoesNotThrow()
    {
        var transaction = BuildTransaction();

        var ex = Record.Exception(() => _sut.EnsureCanCreate(transaction, "manager-1", PersonRole.MANAGER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanReadManagerCreatedTransactionDoesNotThrow()
    {
        var transaction = BuildTransaction(createdByPersonId: "manager-1");

        var ex = Record.Exception(() => _sut.EnsureCanRead(transaction, "manager-1", PersonRole.MANAGER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanReadManagerUnrelatedTransactionThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction(createdByPersonId: "admin-1");

        Assert.Throws<UnauthorizedTransactionAccessException>(
            () => _sut.EnsureCanRead(transaction, "manager-1", PersonRole.MANAGER));
    }

    [Fact]
    public void EnsureCanUpdateManagerWhenCreatorDoesNotThrow()
    {
        var transaction = BuildTransaction(createdByPersonId: "manager-1");

        var ex = Record.Exception(() => _sut.EnsureCanUpdate(transaction, "manager-1", PersonRole.MANAGER));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanUpdateManagerWhenNotCreatorThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction(createdByPersonId: "admin-1");

        Assert.Throws<UnauthorizedTransactionAccessException>(
            () => _sut.EnsureCanUpdate(transaction, "manager-1", PersonRole.MANAGER));
    }

    [Fact]
    public void EnsureCanDeleteAdminDoesNotThrow()
    {
        var transaction = BuildTransaction(createdByPersonId: "someone-else");

        var ex = Record.Exception(() => _sut.EnsureCanDelete(transaction, "admin-1", PersonRole.ADMIN));

        Assert.Null(ex);
    }

    [Fact]
    public void FilterReadableTransactionsReturnsExpectedRowsForManager()
    {
        var involved = BuildTransaction(id: "tx-involved", payerPersonId: "manager-1", payeePersonId: "payee-1", createdByPersonId: "payer-1");
        var created = BuildTransaction(id: "tx-created", payerPersonId: "payer-1", payeePersonId: "payee-1", createdByPersonId: "manager-1");
        var unrelated = BuildTransaction(id: "tx-unrelated", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "admin-1");

        var result = _sut.FilterReadableTransactions(new[] { involved, created, unrelated }, "manager-1", PersonRole.MANAGER);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, transaction => transaction.Id == "tx-involved");
        Assert.Contains(result, transaction => transaction.Id == "tx-created");
    }

    [Fact]
    public void FilterReadableTransactionsReturnsAllForAdmin()
    {
        var all = new[]
        {
            BuildTransaction(id: "tx-1"),
            BuildTransaction(id: "tx-2", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "creator-2")
        };

        var result = _sut.FilterReadableTransactions(all, "admin-1", PersonRole.ADMIN);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void FilterByManagedByWithNullReturnsAllTransactions()
    {
        var transactions = new List<Transaction>
        {
            BuildTransaction(id: "tx-1"),
            BuildTransaction(id: "tx-2", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "creator-2")
        };

        var result = _sut.FilterByManagedBy(transactions, null);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void FilterByManagedByWithEmptyListReturnsAllTransactions()
    {
        var transactions = new List<Transaction>
        {
            BuildTransaction(id: "tx-1"),
        };

        var result = _sut.FilterByManagedBy(transactions, []);

        Assert.Single(result);
    }

    [Fact]
    public void FilterByManagedByExcludesTransactionsWhereCreatorIsAlsoInvolved()
    {
        var directlyInvolved = BuildTransaction(id: "tx-owned", payerPersonId: "person-1", payeePersonId: "person-2", createdByPersonId: "person-1");
        var externallyManaged = BuildTransaction(id: "tx-managed", payerPersonId: "person-3", payeePersonId: "person-4", createdByPersonId: "person-1");

        var result = _sut.FilterByManagedBy([directlyInvolved, externallyManaged], ["person-1"]);

        Assert.Single(result);
        Assert.Equal("tx-managed", result[0].Id);
    }

    [Fact]
    public void FilterByManagedByOnlyIncludesMatchingCreators()
    {
        var managed = BuildTransaction(id: "tx-1", payerPersonId: "payer-1", payeePersonId: "payee-1", createdByPersonId: "manager-1");
        var other = BuildTransaction(id: "tx-2", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "other");

        var result = _sut.FilterByManagedBy([managed, other], ["manager-1"]);

        Assert.Single(result);
        Assert.Equal("tx-1", result[0].Id);
    }

    [Fact]
    public void FilterByInvolvementWithNullReturnsAllTransactions()
    {
        var transactions = new List<Transaction>
        {
            BuildTransaction(id: "tx-1"),
            BuildTransaction(id: "tx-2", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "creator-2")
        };

        var result = _sut.FilterByInvolvement(transactions, "payer-1", null);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void FilterByInvolvementOwnedReturnsOnlyInvolvedTransactions()
    {
        var involved = BuildTransaction(id: "tx-involved", payerPersonId: "user-1", payeePersonId: "payee-1", createdByPersonId: "user-1");
        var managed = BuildTransaction(id: "tx-managed", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "user-1");

        var result = _sut.FilterByInvolvement([involved, managed], "user-1", InvolvementType.Owned);

        Assert.Single(result);
        Assert.Equal("tx-involved", result[0].Id);
    }

    [Fact]
    public void FilterByInvolvementManagedReturnsOnlyManagedTransactions()
    {
        var involved = BuildTransaction(id: "tx-involved", payerPersonId: "user-1", payeePersonId: "payee-1", createdByPersonId: "user-1");
        var managed = BuildTransaction(id: "tx-managed", payerPersonId: "payer-2", payeePersonId: "payee-2", createdByPersonId: "user-1");

        var result = _sut.FilterByInvolvement([involved, managed], "user-1", InvolvementType.Managed);

        Assert.Single(result);
        Assert.Equal("tx-managed", result[0].Id);
    }

    private static Transaction BuildTransaction(
        string id = "tx-1",
        string payerPersonId = "payer-1",
        string payeePersonId = "payee-1",
        string createdByPersonId = "payer-1") =>
        new()
        {
            Id = id,
            PayerPersonId = payerPersonId,
            PayeePersonId = payeePersonId,
            CreatedByPersonId = createdByPersonId,
            Amount = 10m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Shared bill",
            Status = TransactionStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}



