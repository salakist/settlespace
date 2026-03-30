using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Services;

namespace FoTestApi.Domain.Tests.Services;

public class TransactionDomainServiceTests
{
    private readonly TransactionDomainService _sut = new();

    [Fact]
    public void EnsureCanCreateWhenLoggedUserInvolvedDoesNotThrow()
    {
        var transaction = BuildTransaction();

        var ex = Record.Exception(() => _sut.EnsureCanCreate(transaction, "payer-1"));

        Assert.Null(ex);
    }

    [Fact]
    public void EnsureCanCreateWhenLoggedUserNotInvolvedThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanCreate(transaction, "other"));
    }

    [Fact]
    public void EnsureCanReadOrUpdateWhenNotInvolvedThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanReadOrUpdate(transaction, "other"));
    }

    [Fact]
    public void EnsureCanDeleteWhenNotCreatorThrowsUnauthorizedTransactionAccessException()
    {
        var transaction = BuildTransaction();

        Assert.Throws<UnauthorizedTransactionAccessException>(() => _sut.EnsureCanDelete(transaction, "payee-1"));
    }

    private static TransactionEntity BuildTransaction() =>
        new()
        {
            PayerPersonId = "payer-1",
            PayeePersonId = "payee-1",
            CreatedByPersonId = "payer-1",
            Amount = 10m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Shared bill",
            Status = TransactionStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}
