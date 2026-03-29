using FoTestApi.Application.Middleware;
using FoTestApi.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FoTestApi.Application.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly HttpContext _context = new DefaultHttpContext();

    [Fact]
    public async Task DuplicatePersonException_Returns409Conflict()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new DuplicatePersonException("John", "Doe"),
            new MockLogger()
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status409Conflict, _context.Response.StatusCode);
    }

    [Fact]
    public async Task WeakPasswordException_Returns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new WeakPasswordException("Password must be at least 8 characters long."),
            new MockLogger()
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status400BadRequest, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvalidOperationException_NotFound_Returns404NotFound()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Person with ID 'x' not found."),
            new MockLogger()
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status404NotFound, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvalidOperationException_Other_Returns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Some other operation failed."),
            new MockLogger()
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status400BadRequest, _context.Response.StatusCode);
    }

    [Fact]
    public async Task UnhandledException_Returns500InternalServerError()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new Exception("Unexpected error"),
            new MockLogger()
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status500InternalServerError, _context.Response.StatusCode);
    }

    private class MockLogger : ILogger<ExceptionHandlingMiddleware>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => false;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
    }
}
