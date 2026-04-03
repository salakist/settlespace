using Moq;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Services;
using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Debts.Services;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Tests.Debts.Services;

public class DebtApplicationServiceTests
{
    private readonly Mock<ITransactionRepository> _repositoryMock = new();
    private readonly Mock<IDebtDomainService> _domainServiceMock = new();
    private readonly DebtApplicationService _sut;

    public DebtApplicationServiceTests()
    {
        _sut = new DebtApplicationService(_repositoryMock.Object, _domainServiceMock.Object);
    }

    [Fact]
    public async Task GetCurrentUserDebtSummariesAsyncReturnsDomainProjection()
    {
        var transactions = new List<Transaction> { BuildTransaction("tx-1") };
        var summaries = new List<DebtSummary>
        {
            new()
            {
                CounterpartyPersonId = "user-2",
                CurrencyCode = "EUR",
                NetAmount = 12m,
                Direction = DebtDirection.TheyOweYou,
                TransactionCount = 1,
            }
        };

        _repositoryMock.Setup(r => r.GetByInvolvedPersonIdAsync("user-1")).ReturnsAsync(transactions);
        _domainServiceMock.Setup(s => s.BuildDebtSummaries(transactions, "user-1")).Returns(summaries);

        var result = await _sut.GetCurrentUserDebtSummariesAsync("user-1");

        Assert.Single(result);
        Assert.Equal("user-2", result[0].CounterpartyPersonId);
    }

    [Fact]
    public async Task GetCurrentUserDebtDetailsAsyncReturnsPairProjection()
    {
        var transactions = new List<Transaction> { BuildTransaction("tx-1") };
        var details = new List<DebtDetails>
        {
            new()
            {
                CounterpartyPersonId = "user-2",
                CurrencyCode = "EUR",
                NetAmount = 12m,
                Direction = DebtDirection.TheyOweYou,
                TransactionCount = 1,
                PaidByCurrentPerson = 12m,
                PaidByCounterparty = 0m,
                Transactions = transactions,
            }
        };

        _repositoryMock.Setup(r => r.GetByInvolvedPersonIdAsync("user-1")).ReturnsAsync(transactions);
        _domainServiceMock.Setup(s => s.BuildDebtDetails(transactions, "user-1", "user-2")).Returns(details);

        var result = await _sut.GetCurrentUserDebtDetailsAsync("user-1", "user-2");

        var detail = Assert.Single(result);
        Assert.Equal(12m, detail.NetAmount);
    }

    [Fact]
    public async Task SettleCurrentUserDebtAsyncAddsSettlementTransactionToRepository()
    {
        var transactions = new List<Transaction> { BuildTransaction("tx-1", "user-2", "user-1", 25m) };
        var settlementTransaction = BuildTransaction("settlement-1", "user-1", "user-2", 10m);
        settlementTransaction.Category = "Settlement";

        var settlementResult = new DebtSettlementResult
        {
            CounterpartyPersonId = "user-2",
            CurrencyCode = "EUR",
            SettledAmount = 10m,
            RemainingNetAmount = 15m,
            Direction = DebtDirection.YouOweThem,
            SettlementTransaction = settlementTransaction,
        };

        var command = new SettleDebtCommand
        {
            CounterpartyPersonId = "user-2",
            Amount = 10m,
            CurrencyCode = "EUR",
            Description = "Partial settlement",
        };

        _repositoryMock.Setup(r => r.GetByInvolvedPersonIdAsync("user-1")).ReturnsAsync(transactions);
        _domainServiceMock
            .Setup(s => s.CreateSettlement(transactions, "user-1", "user-2", 10m, "EUR", "Partial settlement"))
            .Returns(settlementResult);
        _repositoryMock.Setup(r => r.AddAsync(settlementTransaction)).ReturnsAsync(settlementTransaction);

        var result = await _sut.SettleCurrentUserDebtAsync("user-1", command);

        Assert.Equal("settlement-1", result.SettlementTransaction.Id);
        _repositoryMock.Verify(r => r.AddAsync(settlementTransaction), Times.Once);
    }

    private static Transaction BuildTransaction(
        string id,
        string payerPersonId = "user-1",
        string payeePersonId = "user-2",
        decimal amount = 12m) =>
        new()
        {
            Id = id,
            PayerPersonId = payerPersonId,
            PayeePersonId = payeePersonId,
            CreatedByPersonId = payerPersonId,
            Amount = amount,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Shared taxi",
            Status = TransactionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}
