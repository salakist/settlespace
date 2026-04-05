using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Application.Tests.Transactions.Mapping;

public class TransactionMapperTests
{
    private readonly TransactionMapper _sut = new();

    [Fact]
    public void ToDtoMapsAllFields()
    {
        var entity = new Transaction
        {
            Id = "tx-1",
            PayerPersonId = "payer-1",
            PayeePersonId = "payee-1",
            CreatedByPersonId = "payer-1",
            Amount = 99.99m,
            CurrencyCode = "EUR",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Dinner",
            Category = "Food",
            Status = TransactionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };

        var dto = _sut.ToDto(entity);

        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal(entity.PayerPersonId, dto.PayerPersonId);
        Assert.Equal(entity.PayeePersonId, dto.PayeePersonId);
        Assert.Equal(entity.CreatedByPersonId, dto.CreatedByPersonId);
        Assert.Equal(entity.Amount, dto.Amount);
        Assert.Equal(entity.CurrencyCode, dto.CurrencyCode);
        Assert.Equal(entity.Description, dto.Description);
        Assert.Equal(entity.Category, dto.Category);
        Assert.Equal(entity.Status, dto.Status);
        Assert.Equal(entity.PayerPersonId, dto.PayerDisplayName);
        Assert.Equal(entity.PayeePersonId, dto.PayeeDisplayName);
        Assert.Equal(entity.CreatedByPersonId, dto.CreatedByDisplayName);
    }

    [Fact]
    public void ToEntityForCreateAssignsCreatorAndUppercasesCurrency()
    {
        var command = new CreateTransactionCommand
        {
            PayerPersonId = "payer-1",
            PayeePersonId = "payee-1",
            Amount = 20m,
            CurrencyCode = "eur",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Taxi",
            Category = "Transport",
            Status = TransactionStatus.Pending,
        };

        var entity = _sut.ToEntity(command, "payer-1");

        Assert.Null(entity.Id);
        Assert.Equal("payer-1", entity.CreatedByPersonId);
        Assert.Equal("EUR", entity.CurrencyCode);
    }

    [Fact]
    public void ToEntityForUpdatePreservesIdAndCreatedAt()
    {
        var createdAt = DateTime.UtcNow.AddDays(-1);
        var command = new UpdateTransactionCommand
        {
            PayerPersonId = "payer-1",
            PayeePersonId = "payee-1",
            Amount = 30m,
            CurrencyCode = "USD",
            TransactionDateUtc = DateTime.UtcNow,
            Description = "Movie",
            Category = "Leisure",
            Status = TransactionStatus.Completed,
        };

        var entity = _sut.ToEntity("tx-1", command, "payer-1", createdAt);

        Assert.Equal("tx-1", entity.Id);
        Assert.Equal(createdAt, entity.CreatedAtUtc);
        Assert.Equal("payer-1", entity.CreatedByPersonId);
    }
}



