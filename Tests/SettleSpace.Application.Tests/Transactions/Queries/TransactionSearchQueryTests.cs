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
}
