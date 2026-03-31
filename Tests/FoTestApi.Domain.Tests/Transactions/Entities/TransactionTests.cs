using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Domain.Transactions.Exceptions;

namespace FoTestApi.Domain.Tests.Transactions.Entities;

public class TransactionTests
{
    [Fact]
    public void ValidateValidTransactionDoesNotThrow()
    {
        var transaction = BuildValidTransaction();

        var ex = Record.Exception(() => transaction.Validate());

        Assert.Null(ex);
    }

    [Fact]
    public void ValidateWithSamePayerAndPayeeThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.PayeePersonId = transaction.PayerPersonId;

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithNonPositiveAmountThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.Amount = 0;

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithInvalidCurrencyThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.CurrencyCode = "eur";

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithBlankDescriptionThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.Description = " ";

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithBlankPayerThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.PayerPersonId = " ";

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithBlankPayeeThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.PayeePersonId = " ";

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithBlankCreatorThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.CreatedByPersonId = " ";

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithLongDescriptionThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.Description = new string('a', 201);

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithLongCategoryThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.Category = new string('b', 81);

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateWithFarFutureTransactionDateThrowsInvalidTransactionException()
    {
        var transaction = BuildValidTransaction();
        transaction.TransactionDateUtc = DateTime.UtcNow.AddDays(2);

        Assert.Throws<InvalidTransactionException>(() => transaction.Validate());
    }

    [Fact]
    public void ValidateAllowsCreatorOutsidePayerAndPayee()
    {
        var transaction = BuildValidTransaction();
        transaction.CreatedByPersonId = "manager-1";

        var ex = Record.Exception(() => transaction.Validate());

        Assert.Null(ex);
    }

    [Fact]
    public void IsUserInvolvedReturnsTrueForPayerAndPayee()
    {
        var transaction = BuildValidTransaction();

        Assert.True(transaction.IsUserInvolved("payer-1"));
        Assert.True(transaction.IsUserInvolved("payee-1"));
        Assert.False(transaction.IsUserInvolved("other"));
    }

    [Fact]
    public void IsCreatedByReturnsTrueOnlyForCreator()
    {
        var transaction = BuildValidTransaction();

        Assert.True(transaction.IsCreatedBy("payer-1"));
        Assert.False(transaction.IsCreatedBy("other"));
    }

    private static Transaction BuildValidTransaction() =>
        new()
        {
            PayerPersonId = "payer-1",
            PayeePersonId = "payee-1",
            CreatedByPersonId = "payer-1",
            Amount = 42.5m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Lunch repayment",
            Category = "Food",
            Status = TransactionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };
}



