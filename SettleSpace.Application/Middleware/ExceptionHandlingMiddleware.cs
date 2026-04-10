using SettleSpace.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Middleware
{
    /// <summary>
    /// Global exception handling middleware that translates exceptions to shared ProblemDetails responses.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _environment;
        private readonly IProblemDetailsService _problemDetailsService;

        private static readonly Action<ILogger, string, Exception?> UnhandledExceptionLog =
            LoggerMessage.Define<string>(
                logLevel: LogLevel.Error,
                eventId: new EventId(1, nameof(ExceptionHandlingMiddleware)),
                formatString: "Unhandled exception while processing {Path}");

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment environment,
            IProblemDetailsService problemDetailsService)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
            _problemDetailsService = problemDetailsService;
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

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            UnhandledExceptionLog(_logger, context.Request.Path, exception);

            var statusCode = ResolveStatusCode(exception);
            context.Response.StatusCode = statusCode;

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = ApiProblemDetailsCatalog.GetTitle(exception, statusCode),
                Type = ApiProblemDetailsCatalog.GetTypeUri(exception, statusCode),
                Detail = ShouldExposeExceptionDetail(statusCode)
                    ? exception.Message
                    : "An unexpected error occurred.",
                Instance = context.Request.Path,
            };
            problemDetails.Extensions["traceId"] = context.TraceIdentifier;

            var written = await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = problemDetails,
                Exception = exception,
            });

            if (!written)
            {
                await context.Response.WriteAsJsonAsync(problemDetails);
            }
        }

        private bool ShouldExposeExceptionDetail(int statusCode)
        {
            return statusCode != StatusCodes.Status500InternalServerError || _environment.IsDevelopment();
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

