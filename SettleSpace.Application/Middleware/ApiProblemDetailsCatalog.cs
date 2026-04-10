using SettleSpace.Domain.Auth;
using Microsoft.AspNetCore.Mvc;

namespace SettleSpace.Application.Middleware
{
    public static class ApiProblemDetailsCatalog
    {
        private const string BaseTypePath = "/problems";

        public const string ValidationErrorTitle = "Request validation failed";
        public const string AuthenticationFailedTitle = "Authentication failed";
        public const string UnauthorizedTitle = "Unauthorized";
        public const string ForbiddenTitle = "Forbidden";
        public const string NotFoundTitle = "Resource not found";
        public const string ConflictTitle = "Conflict";
        public const string UnexpectedErrorTitle = "An unexpected error occurred";

        public const string ValidationErrorType = BaseTypePath + "/validation-error";
        public const string InvalidCredentialsType = BaseTypePath + "/invalid-credentials";
        public const string UnauthorizedType = BaseTypePath + "/unauthorized";
        public const string ForbiddenType = BaseTypePath + "/forbidden";
        public const string NotFoundType = BaseTypePath + "/not-found";
        public const string ConflictType = BaseTypePath + "/conflict";
        public const string UnexpectedErrorType = BaseTypePath + "/unexpected-error";

        public static void CustomizeProblemDetails(ProblemDetailsContext context)
        {
            var statusCode = context.ProblemDetails.Status ?? StatusCodes.Status500InternalServerError;
            context.ProblemDetails.Status = statusCode;
            context.ProblemDetails.Instance = context.HttpContext.Request.Path;
            context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

            if (context.ProblemDetails is ValidationProblemDetails)
            {
                context.ProblemDetails.Title = ValidationErrorTitle;
                context.ProblemDetails.Type = ValidationErrorType;
                return;
            }

            if (string.IsNullOrWhiteSpace(context.ProblemDetails.Title))
            {
                context.ProblemDetails.Title = GetTitle(statusCode);
            }

            if (string.IsNullOrWhiteSpace(context.ProblemDetails.Type))
            {
                context.ProblemDetails.Type = GetTypeUri(statusCode);
            }
        }

        public static string GetTitle(int statusCode)
        {
            return statusCode switch
            {
                StatusCodes.Status400BadRequest => ValidationErrorTitle,
                StatusCodes.Status401Unauthorized => UnauthorizedTitle,
                StatusCodes.Status403Forbidden => ForbiddenTitle,
                StatusCodes.Status404NotFound => NotFoundTitle,
                StatusCodes.Status409Conflict => ConflictTitle,
                _ => UnexpectedErrorTitle,
            };
        }

        public static string GetTitle(Exception exception, int statusCode)
        {
            return exception switch
            {
                InvalidCredentialsException => AuthenticationFailedTitle,
                Domain.Exceptions.BadRequestException => ValidationErrorTitle,
                Domain.Exceptions.UnauthorizedException => UnauthorizedTitle,
                Domain.Exceptions.ForbiddenException => ForbiddenTitle,
                Domain.Exceptions.NotFoundException => NotFoundTitle,
                Domain.Exceptions.ConflictException => ConflictTitle,
                _ => GetTitle(statusCode),
            };
        }

        public static string GetTypeUri(int statusCode)
        {
            return statusCode switch
            {
                StatusCodes.Status400BadRequest => ValidationErrorType,
                StatusCodes.Status401Unauthorized => UnauthorizedType,
                StatusCodes.Status403Forbidden => ForbiddenType,
                StatusCodes.Status404NotFound => NotFoundType,
                StatusCodes.Status409Conflict => ConflictType,
                _ => UnexpectedErrorType,
            };
        }

        public static string GetTypeUri(Exception exception, int statusCode)
        {
            return exception switch
            {
                InvalidCredentialsException => InvalidCredentialsType,
                Domain.Exceptions.BadRequestException => ValidationErrorType,
                Domain.Exceptions.UnauthorizedException => UnauthorizedType,
                Domain.Exceptions.ForbiddenException => ForbiddenType,
                Domain.Exceptions.NotFoundException => NotFoundType,
                Domain.Exceptions.ConflictException => ConflictType,
                _ => GetTypeUri(statusCode),
            };
        }
    }
}
