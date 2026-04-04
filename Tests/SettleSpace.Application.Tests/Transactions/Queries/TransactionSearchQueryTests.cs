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
}
