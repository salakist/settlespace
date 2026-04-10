using Moq;
using SettleSpace.Application.Persons.Services;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;

namespace SettleSpace.Application.Tests.Persons.Services;

public class PersonDisplayNameResolverTests
{
    private readonly Mock<IPersonRepository> _personRepositoryMock = new();
    private readonly PersonDisplayNameResolver _sut;

    public PersonDisplayNameResolverTests()
    {
        _sut = new PersonDisplayNameResolver(_personRepositoryMock.Object);
    }

    [Fact]
    public async Task ResolveAsyncReturnsDisplayNamesAndFallsBackToIds()
    {
        _personRepositoryMock
            .Setup(repository => repository.GetByIdsAsync(It.IsAny<List<string>>()))
            .ReturnsAsync(
            [
                new() { Id = "person-1", FirstName = " John ", LastName = " Doe " }
            ]);

        var expectedIds = new[] { "person-1", "missing-person" };

        var result = await _sut.ResolveAsync(["person-1", "missing-person", "person-1", " "]);

        Assert.Equal("John Doe", result["person-1"]);
        Assert.Equal("missing-person", result["missing-person"]);
        _personRepositoryMock.Verify(
            repository => repository.GetByIdsAsync(It.Is<List<string>>(ids => ids.SequenceEqual(expectedIds))),
            Times.Once);
    }
}
