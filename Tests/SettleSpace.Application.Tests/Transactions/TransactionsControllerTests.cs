using SettleSpace.Application.Authentication;
using SettleSpace.Application.Authentication.Services;
using SettleSpace.Domain.Auth;
using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Application.Transactions.Services;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace SettleSpace.Application.Tests.Transactions;

public class TransactionsControllerTests
{
    private readonly Mock<ITransactionApplicationService> _serviceMock = new();
    private readonly Mock<SettleSpace.Application.Persons.Services.IPersonDisplayNameResolver> _personDisplayNameResolverMock = new();
    private readonly Mock<IAuthService> _authServiceMock = new();
    private readonly TransactionsController _controller;

    public TransactionsControllerTests()
    {
        _personDisplayNameResolverMock
            .Setup(resolver => resolver.ResolveAsync(It.IsAny<List<string>>()))
            .ReturnsAsync(new Dictionary<string, string>());

        _controller = new TransactionsController(
            _serviceMock.Object,
            new TransactionMapper(),
            _personDisplayNameResolverMock.Object,
            _authServiceMock.Object);
    }

    [Fact]
    public async Task GetCurrentUserTransactionsReturnsOkWithDtos()
    {
        var transactions = new List<Transaction>
        {
            BuildTransaction("tx-1")
        };
        _serviceMock.Setup(s => s.GetCurrentUserTransactionsAsync("user-1", PersonRole.USER)).ReturnsAsync(transactions);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.GetCurrentUserTransactions();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<TransactionDto>>(ok.Value);
        Assert.Single(dtos);
    }

    [Fact]
    public async Task PostReturnsCreatedAtAction()
    {
        var command = new CreateTransactionCommand
        {
            PayerPersonId = "user-1",
            PayeePersonId = "user-2",
            Amount = 10m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Coffee",
            Status = TransactionStatus.Completed,
        };
        var created = BuildTransaction("507f1f77bcf86cd799439011");
        _serviceMock.Setup(s => s.CreateTransactionAsync("user-1", PersonRole.USER, command)).ReturnsAsync(created);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.Post(command);

        var createdAt = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(TransactionsController.GetById), createdAt.ActionName);
    }

    [Fact]
    public async Task DeleteReturnsNoContent()
    {
        _serviceMock.Setup(s => s.DeleteTransactionAsync("507f1f77bcf86cd799439011", "user-1", PersonRole.USER))
            .Returns(Task.CompletedTask);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.Delete("507f1f77bcf86cd799439011");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task GetByIdThrowsAuthContextExceptionWhenClaimMissing()
    {
        _authServiceMock.Setup(s => s.ResolveAuthContext(It.IsAny<ClaimsPrincipal>()))
            .Throws<AuthContextException>();

        await Assert.ThrowsAsync<AuthContextException>(
            () => _controller.GetById("507f1f77bcf86cd799439011"));
    }

    [Fact]
    public async Task SearchTransactionsReturnsOkWithDtos()
    {
        var query = new TransactionSearchQuery { FreeText = "dinner" };
        _serviceMock.Setup(s => s.SearchTransactionsAsync("user-1", PersonRole.USER, query))
            .ReturnsAsync(new List<Transaction> { BuildTransaction("tx-1") });
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.SearchTransactions(query);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<List<TransactionDto>>(ok.Value);
        Assert.Single(dtos);
    }

    [Fact]
    public async Task SearchTransactionsWithNullFreeTextReturnsOk()
    {
        var query = new TransactionSearchQuery();
        _serviceMock.Setup(s => s.SearchTransactionsAsync("user-1", PersonRole.USER, query))
            .ReturnsAsync(new List<Transaction>());
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.SearchTransactions(query);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateReturnsNoContent()
    {
        var command = new UpdateTransactionCommand
        {
            PayerPersonId = "user-1",
            PayeePersonId = "user-2",
            Amount = 12m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Updated",
            Status = TransactionStatus.Completed,
        };
        _serviceMock.Setup(s => s.UpdateTransactionAsync("507f1f77bcf86cd799439011", "user-1", PersonRole.USER, command))
            .Returns(Task.CompletedTask);
        SetUser("user-1", PersonRole.USER);

        var result = await _controller.Update("507f1f77bcf86cd799439011", command);

        Assert.IsType<NoContentResult>(result);
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
            Description = "Seed",
            Status = TransactionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}



