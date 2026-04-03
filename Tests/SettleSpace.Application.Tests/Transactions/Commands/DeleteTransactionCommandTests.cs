using SettleSpace.Application.Transactions.Commands;

namespace SettleSpace.Application.Tests.Transactions.Commands;

public class DeleteTransactionCommandTests
{
    [Fact]
    public void IdCanBeAssigned()
    {
        var command = new DeleteTransactionCommand { Id = "tx-1" };

        Assert.Equal("tx-1", command.Id);
    }
}

