using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Domain.Tests.Transactions;

public class TransactionSearchFilterTests
{
    [Fact]
    public void ValidatePassesWhenFilterIsEmpty()
    {
        var filter = new TransactionSearchFilter();

        filter.Validate();
    }

    [Fact]
    public void ValidatePassesWhenFreeTextHasContent()
    {
        var filter = new TransactionSearchFilter { FreeText = "dinner" };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFreeTextIsEmptyOrWhitespace(string freeText)
    {
        var filter = new TransactionSearchFilter { FreeText = freeText };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenStatusHasValues()
    {
        var filter = new TransactionSearchFilter { Status = [TransactionStatus.Pending] };

        filter.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenStatusIsEmptyList()
    {
        var filter = new TransactionSearchFilter { Status = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenCategoryHasContent()
    {
        var filter = new TransactionSearchFilter { Category = "food" };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenCategoryIsEmptyOrWhitespace(string category)
    {
        var filter = new TransactionSearchFilter { Category = category };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenDescriptionHasContent()
    {
        var filter = new TransactionSearchFilter { Description = "taxi ride" };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenDescriptionIsEmptyOrWhitespace(string description)
    {
        var filter = new TransactionSearchFilter { Description = description };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenInvolvedHasValues()
    {
        var filter = new TransactionSearchFilter { Involved = ["person-1", "person-2"] };

        filter.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenInvolvedIsEmptyList()
    {
        var filter = new TransactionSearchFilter { Involved = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenInvolvedContainsEmptyOrWhitespaceId(string id)
    {
        var filter = new TransactionSearchFilter { Involved = ["person-1", id] };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenManagedByHasValues()
    {
        var filter = new TransactionSearchFilter { ManagedBy = ["person-1"] };

        filter.Validate();
    }

    [Fact]
    public void ValidateThrowsWhenManagedByIsEmptyList()
    {
        var filter = new TransactionSearchFilter { ManagedBy = [] };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenManagedByContainsEmptyOrWhitespaceId(string id)
    {
        var filter = new TransactionSearchFilter { ManagedBy = [id] };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenPayerHasContent()
    {
        var filter = new TransactionSearchFilter { Payer = "person-1" };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenPayerIsEmptyOrWhitespace(string payer)
    {
        var filter = new TransactionSearchFilter { Payer = payer };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenPayeeHasContent()
    {
        var filter = new TransactionSearchFilter { Payee = "person-2" };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenPayeeIsEmptyOrWhitespace(string payee)
    {
        var filter = new TransactionSearchFilter { Payee = payee };

        Assert.Throws<InvalidTransactionSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidatePassesWhenInvolvementIsOwned()
    {
        var filter = new TransactionSearchFilter { Involvement = InvolvementType.Owned };

        filter.Validate();
    }

    [Fact]
    public void ValidatePassesWhenInvolvementIsManaged()
    {
        var filter = new TransactionSearchFilter { Involvement = InvolvementType.Managed };

        filter.Validate();
    }
}
