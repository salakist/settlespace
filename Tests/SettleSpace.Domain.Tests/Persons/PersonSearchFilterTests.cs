using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Persons.Exceptions;

namespace SettleSpace.Domain.Tests.Persons;

public class PersonSearchFilterTests
{
    [Fact]
    public void ValidatePassesWhenFilterIsEmpty()
    {
        var filter = new PersonSearchFilter();

        filter.Validate();
    }

    [Fact]
    public void ValidatePassesWhenListsContainValues()
    {
        var filter = new PersonSearchFilter
        {
            FirstName = ["John"],
            Role = [PersonRole.USER],
            DateOfBirth = [new DateOnly(1990, 4, 12)]
        };

        filter.Validate();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFreeTextIsEmptyOrWhitespace(string freeText)
    {
        var filter = new PersonSearchFilter { FreeText = freeText };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenFirstNameListIsEmpty()
    {
        var filter = new PersonSearchFilter { FirstName = [] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateThrowsWhenFirstNameContainsWhitespaceOnlyValue(string firstName)
    {
        var filter = new PersonSearchFilter { FirstName = ["John", firstName] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenLastNameListIsEmpty()
    {
        var filter = new PersonSearchFilter { LastName = [] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenRoleListIsEmpty()
    {
        var filter = new PersonSearchFilter { Role = [] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenDateOfBirthListIsEmpty()
    {
        var filter = new PersonSearchFilter { DateOfBirth = [] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenDateOfBirthIsInFuture()
    {
        var filter = new PersonSearchFilter { DateOfBirth = [DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1))] };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenDateOfBirthBeforeIsInFuture()
    {
        var filter = new PersonSearchFilter { DateOfBirthBefore = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)) };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenDateRangeIsInconsistent()
    {
        var filter = new PersonSearchFilter
        {
            DateOfBirthBefore = new DateOnly(1990, 1, 1),
            DateOfBirthAfter = new DateOnly(2000, 1, 1)
        };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }

    [Fact]
    public void ValidateThrowsWhenExactDatesAndRangeBothProvided()
    {
        var filter = new PersonSearchFilter
        {
            DateOfBirth = [new DateOnly(1990, 4, 12)],
            DateOfBirthBefore = new DateOnly(1995, 1, 1)
        };

        Assert.Throws<InvalidPersonSearchException>(() => filter.Validate());
    }
}
