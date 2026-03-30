using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Domain.Transactions.Exceptions;

namespace FoTestApi.Domain.Tests.Transactions.Exceptions;

public class TransactionExceptionsTests
{
    [Fact]
    public void InvalidTransactionExceptionConstructorsSetMessages()
    {
        var exception = new InvalidTransactionException("bad");
        var wrapped = new InvalidTransactionException("wrapped", exception);

        Assert.Equal("bad", exception.Message);
        Assert.Equal("wrapped", wrapped.Message);
        Assert.Equal(exception, wrapped.InnerException);
    }

    [Fact]
    public void UnauthorizedTransactionAccessExceptionConstructorsSetMessages()
    {
        var exception = new UnauthorizedTransactionAccessException("forbidden");
        var wrapped = new UnauthorizedTransactionAccessException("wrapped", exception);

        Assert.Equal("forbidden", exception.Message);
        Assert.Equal("wrapped", wrapped.Message);
        Assert.Equal(exception, wrapped.InnerException);
    }

    [Fact]
    public void TransactionNotFoundExceptionConstructorsSetMessages()
    {
        var exception = new TransactionNotFoundException("tx-1");
        var wrapped = new TransactionNotFoundException("wrapped", exception);

        Assert.Contains("tx-1", exception.Message);
        Assert.Equal("wrapped", wrapped.Message);
        Assert.Equal(exception, wrapped.InnerException);
    }

    [Fact]
    public void TransactionStatusEnumContainsExpectedValues()
    {
        Assert.Equal(TransactionStatus.Pending, (TransactionStatus)0);
        Assert.Equal(TransactionStatus.Completed, (TransactionStatus)1);
        Assert.Equal(TransactionStatus.Cancelled, (TransactionStatus)2);
    }

    [Fact]
    public void TransactionStatusCatalogReturnsAllValues()
    {
        var values = TransactionStatusCatalog.All();

        Assert.Contains(TransactionStatus.Pending, values);
        Assert.Contains(TransactionStatus.Completed, values);
        Assert.Contains(TransactionStatus.Cancelled, values);
    }
}


