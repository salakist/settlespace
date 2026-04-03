using SettleSpace.Application.Middleware;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Exceptions;
using SettleSpace.Domain.Transactions.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SettleSpace.Application.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly HttpContext _context = new DefaultHttpContext();
    private readonly IHostEnvironment _environment = new MockHostEnvironment();

    [Fact]
    public async Task AuthContextExceptionReturns401Unauthorized()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new AuthContextException(),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status401Unauthorized, _context.Response.StatusCode);
    }

    [Fact]
    public async Task DuplicatePersonExceptionReturns409Conflict()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new DuplicatePersonException("John", "Doe"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status409Conflict, _context.Response.StatusCode);
    }

    [Fact]
    public async Task WeakPasswordExceptionReturns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new WeakPasswordException("Password must be at least 8 characters long."),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status400BadRequest, _context.Response.StatusCode);
    }

    [Fact]
    public async Task UnauthorizedTransactionAccessExceptionReturns403Forbidden()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new UnauthorizedTransactionAccessException("Forbidden"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status403Forbidden, _context.Response.StatusCode);
    }

    [Fact]
    public async Task TransactionNotFoundExceptionReturns404NotFound()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new TransactionNotFoundException("tx-1"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status404NotFound, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvalidTransactionExceptionReturns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidTransactionException("Invalid"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status400BadRequest, _context.Response.StatusCode);
    }

    [Fact]
    public async Task PersonNotFoundExceptionReturns404NotFound()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new PersonNotFoundException("person-1"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status404NotFound, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvalidPersonExceptionReturns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidPersonException("Some person validation failed."),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status400BadRequest, _context.Response.StatusCode);
    }

    [Fact]
    public async Task UnhandledExceptionReturns500InternalServerError()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new NotSupportedException("Unexpected error"),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status500InternalServerError, _context.Response.StatusCode);
    }

    private sealed class MockLogger : ILogger<ExceptionHandlingMiddleware>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => false;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
    }

    private sealed class MockHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "SettleSpace.Application.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}

