using FoTestApi.Domain.Auth;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Persons.Exceptions;
using FoTestApi.Domain.Transactions.Exceptions;
using System.Text.Json;

namespace FoTestApi.Application.Middleware
{
    /// <summary>
    /// Global exception handling middleware that translates domain exceptions to HTTP responses.
    /// Catches domain exceptions and maps them to appropriate HTTP status codes and error responses.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        private static readonly Action<ILogger, string, Exception?> UnhandledExceptionLog =
            LoggerMessage.Define<string>(
                logLevel: LogLevel.Error,
                eventId: new EventId(1, nameof(ExceptionHandlingMiddleware)),
                formatString: "Unhandled exception while processing {Path}");

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            UnhandledExceptionLog(_logger, context.Request.Path, exception);
            context.Response.ContentType = "application/json";

            var response = new { error = exception.Message };

            switch (exception)
            {
                case AuthContextException:
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    break;

                case DuplicatePersonException:
                    context.Response.StatusCode = StatusCodes.Status409Conflict;
                    break;

                case WeakPasswordException:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    break;

                case UnauthorizedTransactionAccessException:
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    break;

                case UnauthorizedPersonAccessException:
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    break;

                case TransactionNotFoundException:
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    break;

                case InvalidTransactionException:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    break;

                case InvalidOperationException when exception.Message.Contains("not found"):
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    break;

                case InvalidOperationException:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    break;

                default:
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    response = _environment.IsDevelopment()
                        ? new { error = exception.Message }
                        : new { error = "An unexpected error occurred." };
                    break;
            }

            return context.Response.WriteAsJsonAsync(response);
        }
    }
}

