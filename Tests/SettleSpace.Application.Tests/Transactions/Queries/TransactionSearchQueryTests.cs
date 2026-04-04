using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Application.Tests.Transactions.Queries;

public class TransactionSearchQueryTests
{
    [Fact]
    public void ValidatePassesWhenFreeTextIsNull()
    {
        var query = new TransactionSearchQuery();

        query.Validate();
    }

    [Fact]
    public void ValidatePassesWhenFreeTextHasContent()
    {
        var query = new TransactionSearchQuery { FreeText = "dinner" };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFreeTextIsEmptyOrWhitespace(string freeText)
    {
        var query = new TransactionSearchQuery { FreeText = freeText };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenStatusHasValues()
    {
        var query = new TransactionSearchQuery { Status = [TransactionStatus.Pending] };

        query.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenStatusIsEmptyList()
    {
        var query = new TransactionSearchQuery { Status = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenCategoryHasContent()
    {
        var query = new TransactionSearchQuery { Category = "food" };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenCategoryIsEmptyOrWhitespace(string category)
    {
        var query = new TransactionSearchQuery { Category = category };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenDescriptionHasContent()
    {
        var query = new TransactionSearchQuery { Description = "taxi ride" };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenDescriptionIsEmptyOrWhitespace(string description)
    {
        var query = new TransactionSearchQuery { Description = description };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenInvolvedHasValues()
    {
        var query = new TransactionSearchQuery { Involved = ["person-1", "person-2"] };

        query.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenInvolvedIsEmptyList()
    {
        var query = new TransactionSearchQuery { Involved = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenInvolvedContainsEmptyOrWhitespaceId(string id)
    {
        var query = new TransactionSearchQuery { Involved = ["person-1", id] };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenManagedByHasValues()
    {
        var query = new TransactionSearchQuery { ManagedBy = ["person-1"] };

        query.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenManagedByIsEmptyList()
    {
        var query = new TransactionSearchQuery { ManagedBy = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenManagedByContainsEmptyOrWhitespaceId(string id)
    {
        var query = new TransactionSearchQuery { ManagedBy = [id] };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenPayerHasContent()
    {
        var query = new TransactionSearchQuery { Payer = "person-1" };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenPayerIsEmptyOrWhitespace(string payer)
    {
        var query = new TransactionSearchQuery { Payer = payer };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidatePassesWhenPayeeHasContent()
    {
        var query = new TransactionSearchQuery { Payee = "person-2" };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenPayeeIsEmptyOrWhitespace(string payee)
    {
        var query = new TransactionSearchQuery { Payee = payee };

        Assert.Throws<InvalidTransactionSearchException>(() => query.Validate());
    }
}
