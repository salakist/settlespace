using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Application.Middleware
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

            var statusCode = ResolveStatusCode(exception);
            context.Response.StatusCode = statusCode;

            var response = statusCode == StatusCodes.Status500InternalServerError && !_environment.IsDevelopment()
                ? new { error = "An unexpected error occurred." }
                : new { error = exception.Message };

            return context.Response.WriteAsJsonAsync(response);
        }

        private static int ResolveStatusCode(Exception exception)
        {
            return exception switch
            {
                UnauthorizedException => StatusCodes.Status401Unauthorized,
                ForbiddenException => StatusCodes.Status403Forbidden,
                NotFoundException => StatusCodes.Status404NotFound,
                ConflictException => StatusCodes.Status409Conflict,
                BadRequestException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError,
            };
        }
    }
}

