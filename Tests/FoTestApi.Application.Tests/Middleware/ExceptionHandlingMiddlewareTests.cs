using FoTestApi.Application.Middleware;
using FoTestApi.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FoTestApi.Application.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly HttpContext _context = new DefaultHttpContext();
    private readonly IHostEnvironment _environment = new MockHostEnvironment();

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
    public async Task InvalidOperationExceptionNotFoundReturns404NotFound()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Person with ID 'x' not found."),
            new MockLogger(),
            _environment
        );

        await middleware.InvokeAsync(_context);

        Assert.Equal(StatusCodes.Status404NotFound, _context.Response.StatusCode);
    }

    [Fact]
    public async Task InvalidOperationExceptionOtherReturns400BadRequest()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("Some other operation failed."),
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
        public string ApplicationName { get; set; } = "FoTestApi.Application.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
