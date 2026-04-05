using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Debts.Exceptions;
using SettleSpace.Domain.Debts.Services;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Tests.Debts.Services;

public class DebtDomainServiceTests
{
    private readonly DebtDomainService _sut = new();

    [Fact]
    public void BuildDebtSummariesNetsBalancesPerCounterpartyAndCurrency()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-1", "user-2", 50m, "EUR", TransactionStatus.Completed),
            BuildTransaction("tx-2", "user-2", "user-1", 20m, "EUR", TransactionStatus.Completed),
            BuildTransaction("tx-3", "user-1", "user-2", 5m, "USD", TransactionStatus.Completed),
        };

        var result = _sut.BuildDebtSummaries(transactions, "user-1");

        Assert.Equal(2, result.Count);

        var eur = Assert.Single(result.Where(summary => summary.CurrencyCode == "EUR"));
        Assert.Equal("user-2", eur.CounterpartyPersonId);
        Assert.Equal(30m, eur.NetAmount);
        Assert.Equal(DebtDirection.TheyOweYou, eur.Direction);
        Assert.Equal(2, eur.TransactionCount);

        var usd = Assert.Single(result.Where(summary => summary.CurrencyCode == "USD"));
        Assert.Equal(5m, usd.NetAmount);
        Assert.Equal(DebtDirection.TheyOweYou, usd.Direction);
    }

    [Fact]
    public void BuildDebtSummariesIgnoresPendingAndCancelledTransactions()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-1", "user-2", 40m, "EUR", TransactionStatus.Completed),
            BuildTransaction("tx-2", "user-1", "user-2", 15m, "EUR", TransactionStatus.Pending),
            BuildTransaction("tx-3", "user-2", "user-1", 5m, "EUR", TransactionStatus.Cancelled),
        };

        var result = _sut.BuildDebtSummaries(transactions, "user-1");

        var summary = Assert.Single(result);
        Assert.Equal(40m, summary.NetAmount);
        Assert.Equal(1, summary.TransactionCount);
    }

    [Fact]
    public void BuildDebtDetailsReturnsSettledDirectionWhenNetBalanceIsZero()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-1", "user-2", 25m, "EUR", TransactionStatus.Completed),
            BuildTransaction("tx-2", "user-2", "user-1", 25m, "EUR", TransactionStatus.Completed),
        };

        var result = _sut.BuildDebtDetails(transactions, "user-1", "user-2");

        var detail = Assert.Single(result);
        Assert.Equal(0m, detail.NetAmount);
        Assert.Equal(DebtDirection.Settled, detail.Direction);
        Assert.Equal(25m, detail.PaidByCurrentPerson);
        Assert.Equal(25m, detail.PaidByCounterparty);
    }

    [Fact]
    public void BuildDebtSummariesIncludesSettledBalancesWhenNetBalanceIsZero()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-1", "user-2", 25m, "EUR", TransactionStatus.Completed),
            BuildTransaction("tx-2", "user-2", "user-1", 25m, "EUR", TransactionStatus.Completed),
        };

        var result = _sut.BuildDebtSummaries(transactions, "user-1");

        var summary = Assert.Single(result);
        Assert.Equal(0m, summary.NetAmount);
        Assert.Equal(DebtDirection.Settled, summary.Direction);
        Assert.Equal(2, summary.TransactionCount);
    }

    [Fact]
    public void CreateSettlementWhenAmountExceedsOutstandingDebtThrowsInvalidDebtSettlementException()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-2", "user-1", 10m, "EUR", TransactionStatus.Completed),
        };

        Assert.Throws<InvalidDebtSettlementException>(() =>
            _sut.CreateSettlement(transactions, "user-1", "user-2", 15m, "EUR", "Too much"));
    }

    [Fact]
    public void CreateSettlementWhenCurrentUserOwesCounterpartyCreatesOutgoingSettlementTransaction()
    {
        var transactions = new[]
        {
            BuildTransaction("tx-1", "user-2", "user-1", 25m, "EUR", TransactionStatus.Completed),
        };

        var result = _sut.CreateSettlement(transactions, "user-1", "user-2", 10m, "EUR", "Partial settlement");

        Assert.Equal("user-1", result.SettlementTransaction.PayerPersonId);
        Assert.Equal("user-2", result.SettlementTransaction.PayeePersonId);
        Assert.Equal(10m, result.SettlementTransaction.Amount);
        Assert.Equal("Settlement", result.SettlementTransaction.Category);
        Assert.Equal(TransactionStatus.Completed, result.SettlementTransaction.Status);
        Assert.Equal(15m, result.RemainingNetAmount);
        Assert.Equal(DebtDirection.YouOweThem, result.Direction);
    }

    private static Transaction BuildTransaction(
        string id,
        string payerPersonId,
        string payeePersonId,
        decimal amount,
        string currencyCode,
        TransactionStatus status) =>
        new()
        {
            Id = id,
            PayerPersonId = payerPersonId,
            PayeePersonId = payeePersonId,
            CreatedByPersonId = payerPersonId,
            Amount = amount,
            CurrencyCode = currencyCode,
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Shared cost",
            Status = status,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}
