using System.Text.Json;
using SettleSpace.Application.Middleware;
using SettleSpace.Domain.Auth;
using SettleSpace.Domain.Persons.Exceptions;
using SettleSpace.Domain.Transactions.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SettleSpace.Application.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private const string ProblemTypeBaseUri = "/problems";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly IHostEnvironment _environment = new MockHostEnvironment();

    [Fact]
    public async Task AuthContextExceptionReturns401Unauthorized()
    {
        var (statusCode, problem) = await InvokeAsync(new AuthContextException());

        Assert.Equal(StatusCodes.Status401Unauthorized, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status401Unauthorized,
            "Unauthorized",
            $"{ProblemTypeBaseUri}/unauthorized",
            "Authentication context is missing or invalid.");
    }

    [Fact]
    public async Task InvalidCredentialsExceptionReturns401AuthenticationFailed()
    {
        var (statusCode, problem) = await InvokeAsync(new InvalidCredentialsException());

        Assert.Equal(StatusCodes.Status401Unauthorized, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status401Unauthorized,
            "Authentication failed",
            $"{ProblemTypeBaseUri}/invalid-credentials",
            "Invalid username or password.");
    }

    [Fact]
    public async Task DuplicatePersonExceptionReturns409Conflict()
    {
        var (statusCode, problem) = await InvokeAsync(new DuplicatePersonException("John", "Doe"));

        Assert.Equal(StatusCodes.Status409Conflict, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status409Conflict,
            "Conflict",
            $"{ProblemTypeBaseUri}/conflict",
            "A person with first name 'John' and last name 'Doe' already exists.");
    }

    [Fact]
    public async Task InvalidCurrentPasswordExceptionReturns400BadRequest()
    {
        var (statusCode, problem) = await InvokeAsync(new InvalidCurrentPasswordException());

        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status400BadRequest,
            "Request validation failed",
            $"{ProblemTypeBaseUri}/validation-error",
            "Current password is invalid.");
    }

    [Fact]
    public async Task WeakPasswordExceptionReturns400BadRequest()
    {
        var (statusCode, problem) = await InvokeAsync(new WeakPasswordException("Password must be at least 8 characters long."));

        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status400BadRequest,
            "Request validation failed",
            $"{ProblemTypeBaseUri}/validation-error",
            "Weak password: Password must be at least 8 characters long.");
    }

    [Fact]
    public async Task UnauthorizedTransactionAccessExceptionReturns403Forbidden()
    {
        var (statusCode, problem) = await InvokeAsync(new UnauthorizedTransactionAccessException("Forbidden"));

        Assert.Equal(StatusCodes.Status403Forbidden, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status403Forbidden,
            "Forbidden",
            $"{ProblemTypeBaseUri}/forbidden",
            "Forbidden");
    }

    [Fact]
    public async Task TransactionNotFoundExceptionReturns404NotFound()
    {
        var (statusCode, problem) = await InvokeAsync(new TransactionNotFoundException("tx-1"));

        Assert.Equal(StatusCodes.Status404NotFound, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status404NotFound,
            "Resource not found",
            $"{ProblemTypeBaseUri}/not-found",
            "Transaction with ID 'tx-1' not found.");
    }

    [Fact]
    public async Task InvalidTransactionExceptionReturns400BadRequest()
    {
        var (statusCode, problem) = await InvokeAsync(new InvalidTransactionException("Invalid"));

        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status400BadRequest,
            "Request validation failed",
            $"{ProblemTypeBaseUri}/validation-error",
            "Invalid");
    }

    [Fact]
    public async Task PersonNotFoundExceptionReturns404NotFound()
    {
        var (statusCode, problem) = await InvokeAsync(new PersonNotFoundException("person-1"));

        Assert.Equal(StatusCodes.Status404NotFound, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status404NotFound,
            "Resource not found",
            $"{ProblemTypeBaseUri}/not-found",
            "Person with ID 'person-1' not found.");
    }

    [Fact]
    public async Task InvalidPersonExceptionReturns400BadRequest()
    {
        var (statusCode, problem) = await InvokeAsync(new InvalidPersonException("Some person validation failed."));

        Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status400BadRequest,
            "Request validation failed",
            $"{ProblemTypeBaseUri}/validation-error",
            "Some person validation failed.");
    }

    [Fact]
    public async Task UnhandledExceptionReturns500InternalServerError()
    {
        var (statusCode, problem) = await InvokeAsync(new NotSupportedException("Unexpected error"));

        Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
        AssertProblem(
            problem,
            StatusCodes.Status500InternalServerError,
            "An unexpected error occurred",
            $"{ProblemTypeBaseUri}/unexpected-error",
            "Unexpected error");
    }

    private async Task<(int StatusCode, ProblemDetails Problem)> InvokeAsync(Exception exception)
    {
        var context = CreateHttpContext();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw exception,
            new MockLogger(),
            _environment,
            CreateProblemDetailsService());

        await middleware.InvokeAsync(context);
        var problem = await ReadProblemDetailsAsync(context);

        return (context.Response.StatusCode, problem);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext
        {
            TraceIdentifier = "test-trace-id"
        };
        context.Request.Path = "/test/error";
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails> ReadProblemDetailsAsync(DefaultHttpContext context)
    {
        context.Response.Body.Position = 0;
        var problem = await JsonSerializer.DeserializeAsync<ProblemDetails>(
            context.Response.Body,
            SerializerOptions);

        Assert.NotNull(problem);
        return problem!;
    }

    private static IProblemDetailsService CreateProblemDetailsService()
    {
        var services = new ServiceCollection();
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = ApiProblemDetailsCatalog.CustomizeProblemDetails;
        });

        return services.BuildServiceProvider().GetRequiredService<IProblemDetailsService>();
    }

    private static void AssertProblem(ProblemDetails problem, int expectedStatus, string expectedTitle, string expectedType, string expectedDetail)
    {
        Assert.Equal(expectedStatus, problem.Status);
        Assert.Equal(expectedTitle, problem.Title);
        Assert.Equal(expectedType, problem.Type);
        Assert.Equal(expectedDetail, problem.Detail);
        Assert.Equal("/test/error", problem.Instance);
        Assert.True(problem.Extensions.TryGetValue("traceId", out var traceId));
        Assert.Equal("test-trace-id", traceId?.ToString());
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

