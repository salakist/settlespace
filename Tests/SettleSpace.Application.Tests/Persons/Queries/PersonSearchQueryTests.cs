using SettleSpace.Application.Persons.Queries;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Application.Tests.Persons.Queries;

public class PersonSearchQueryTests
{
    [Fact]
    public void ValidatePassesWhenQueryIsEmpty()
    {
        var query = new PersonSearchQuery();

        query.Validate();
    }

    [Fact]
    public void ValidatePassesWhenListsContainValues()
    {
        var query = new PersonSearchQuery
        {
            FirstName = ["John"],
            Role = [PersonRole.USER],
            DateOfBirth = [new DateOnly(1990, 4, 12)]
        };

        query.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFreeTextIsEmptyOrWhitespace(string freeText)
    {
        var query = new PersonSearchQuery { FreeText = freeText };

        Assert.Throws<InvalidPersonSearchException>(() => query.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenFirstNameListIsEmpty()
    {
        var query = new PersonSearchQuery { FirstName = [] };

        Assert.Throws<InvalidPersonSearchException>(() => query.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFirstNameContainsWhitespaceOnlyValue(string firstName)
    {
        var query = new PersonSearchQuery { FirstName = ["John", firstName] };

        Assert.Throws<InvalidPersonSearchException>(() => query.Validate());
    }
}
