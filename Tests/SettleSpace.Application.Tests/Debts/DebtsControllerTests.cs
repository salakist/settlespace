using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Application.Debts;
using SettleSpace.Application.Debts.Commands;
using SettleSpace.Application.Debts.Mapping;
using SettleSpace.Application.Debts.Services;
using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Persons.Entities;
using System.Security.Claims;

namespace SettleSpace.Application.Tests.Debts;

public class DebtsControllerTests
{
    private readonly Mock<IDebtApplicationService> _serviceMock = new();
    private readonly Mock<SettleSpace.Application.Persons.Services.IPersonDisplayNameResolver> _personDisplayNameResolverMock = new();
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly DebtsController _controller;

    public DebtsControllerTests()
    {
        _personDisplayNameResolverMock
            .Setup(resolver => resolver.ResolveAsync(It.IsAny<List<string>>()))
            .ReturnsAsync(new Dictionary<string, string>());

        _controller = new DebtsController(
            _serviceMock.Object,
            new DebtMapper(),
            _personDisplayNameResolverMock.Object,
            _authServiceMock.Object);
    }

    [Fact]
    public async Task GetCurrentUserDebtsReturnsOkWithDtos()
    {
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
        _serviceMock.Setup(s => s.GetCurrentUserDebtSummariesAsync("user-1")).ReturnsAsync(summaries);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.GetCurrentUserDebts();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<DebtSummaryDto>>(ok.Value);
        Assert.Single(dtos);
        Assert.Equal("user-2", dtos[0].CounterpartyDisplayName);
    }

    [Fact]
    public async Task GetCurrentUserDebtsReturnsOkWithSettledDtos()
    {
        var summaries = new List<DebtSummary>
        {
            new()
            {
                CounterpartyPersonId = "user-2",
                CurrencyCode = "EUR",
                NetAmount = 0m,
                Direction = DebtDirection.Settled,
                TransactionCount = 2,
            }
        };
        _serviceMock.Setup(s => s.GetCurrentUserDebtSummariesAsync("user-1")).ReturnsAsync(summaries);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.GetCurrentUserDebts();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<DebtSummaryDto>>(ok.Value);
        var dto = Assert.Single(dtos);
        Assert.Equal(0m, dto.NetAmount);
        Assert.Equal(DebtDirection.Settled, dto.Direction);
    }

    [Fact]
    public async Task GetCurrentUserDebtDetailsReturnsOkWithDtos()
    {
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
                Transactions = [],
            }
        };
        _serviceMock.Setup(s => s.GetCurrentUserDebtDetailsAsync("user-1", "user-2")).ReturnsAsync(details);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.GetCurrentUserDebtDetails("user-2");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<DebtDetailsDto>>(ok.Value);
        Assert.Single(dtos);
    }

    [Fact]
    public async Task SettleReturnsOkWithResultDto()
    {
        var settlementResult = new DebtSettlementResult
        {
            CounterpartyPersonId = "user-2",
            CurrencyCode = "EUR",
            SettledAmount = 10m,
            RemainingNetAmount = 5m,
            Direction = DebtDirection.YouOweThem,
            SettlementTransaction = new Domain.Transactions.Entities.Transaction
            {
                Id = "settlement-1",
                PayerPersonId = "user-1",
                PayeePersonId = "user-2",
                CreatedByPersonId = "user-1",
                Amount = 10m,
                CurrencyCode = "EUR",
                TransactionDateUtc = DateTime.UtcNow,
                Description = "Settlement",
                Status = Domain.Transactions.Entities.TransactionStatus.Completed,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            }
        };
        var command = new SettleDebtCommand
        {
            CounterpartyPersonId = "user-2",
            Amount = 10m,
            CurrencyCode = "EUR",
            Description = "Partial settlement",
        };

        _serviceMock.Setup(s => s.SettleCurrentUserDebtAsync("user-1", command)).ReturnsAsync(settlementResult);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.Settle(command);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<DebtSettlementResultDto>(ok.Value);
        Assert.Equal("settlement-1", dto.SettlementTransactionId);
    }

    private void SetUser(string personId, PersonRole role)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(CustomClaimTypes.PersonId, personId),
                        new Claim(CustomClaimTypes.PersonRole, role.ToString())
                    },
                    "TestAuth"))
            }
        };

        _authServiceMock
            .Setup(s => s.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Returns((personId, role));
    }
}
