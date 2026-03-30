using FoTestApi.Application.Authentication;
using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Application.Transactions;
using FoTestApi.Application.Transactions.Mapping;
using FoTestApi.Application.Transactions.Services;
using FoTestApi.Domain.Transactions.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace FoTestApi.Application.Tests.Transactions;

public class TransactionsControllerTests
{
    private readonly Mock<ITransactionApplicationService> _serviceMock = new();
    private readonly TransactionsController _controller;

    public TransactionsControllerTests()
    {
        _controller = new TransactionsController(_serviceMock.Object, new TransactionMapper());
    }

    [Fact]
    public async Task GetCurrentUserTransactionsReturnsOkWithDtos()
    {
        var transactions = new List<Transaction>
        {
            BuildTransaction("tx-1")
        };
        _serviceMock.Setup(s => s.GetCurrentUserTransactionsAsync("user-1")).ReturnsAsync(transactions);
        SetUser("user-1");

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
        _serviceMock.Setup(s => s.CreateTransactionAsync("user-1", command)).ReturnsAsync(created);
        SetUser("user-1");

        var result = await _controller.Post(command);

        var createdAt = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(TransactionsController.GetById), createdAt.ActionName);
    }

    [Fact]
    public async Task DeleteReturnsNoContent()
    {
        _serviceMock.Setup(s => s.DeleteTransactionAsync("507f1f77bcf86cd799439011", "user-1"))
            .Returns(Task.CompletedTask);
        SetUser("user-1");

        var result = await _controller.Delete("507f1f77bcf86cd799439011");

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task GetByIdReturnsUnauthorizedWhenClaimMissing()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var result = await _controller.GetById("507f1f77bcf86cd799439011");

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task SearchCurrentUserTransactionsReturnsOk()
    {
        _serviceMock.Setup(s => s.SearchCurrentUserTransactionsAsync("user-1", "taxi"))
            .ReturnsAsync(new List<Transaction> { BuildTransaction("tx-1") });
        SetUser("user-1");

        var result = await _controller.SearchCurrentUserTransactions("taxi");

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
        _serviceMock.Setup(s => s.UpdateTransactionAsync("507f1f77bcf86cd799439011", "user-1", command))
            .Returns(Task.CompletedTask);
        SetUser("user-1");

        var result = await _controller.Update("507f1f77bcf86cd799439011", command);

        Assert.IsType<NoContentResult>(result);
    }

    private void SetUser(string personId)
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(CustomClaimTypes.PersonId, personId) },
                    "TestAuth"))
            }
        };
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



