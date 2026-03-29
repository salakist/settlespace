using FoTestApi.Domain.Exceptions;
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

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
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

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new { error = exception.Message };
            string jsonResponse = JsonSerializer.Serialize(response);

            switch (exception)
            {
                case DuplicatePersonException:
                    context.Response.StatusCode = StatusCodes.Status409Conflict;
                    break;

                case WeakPasswordException:
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
                    response = new { error = "An unexpected error occurred." };
                    jsonResponse = JsonSerializer.Serialize(response);
                    break;
            }

            return context.Response.WriteAsJsonAsync(response);
        }
    }
}
