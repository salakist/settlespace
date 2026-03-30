using FoTestApi.Application.Commands;

namespace FoTestApi.Application.Tests.Commands;

public class DeleteTransactionCommandTests
{
    [Fact]
    public void IdCanBeAssigned()
    {
        var command = new DeleteTransactionCommand { Id = "tx-1" };

        Assert.Equal("tx-1", command.Id);
    }
}