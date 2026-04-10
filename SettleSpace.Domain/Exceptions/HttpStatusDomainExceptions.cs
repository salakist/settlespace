namespace SettleSpace.Domain.Exceptions;

public abstract class BadRequestException : DomainException
{
    protected BadRequestException()
    {
    }

    protected BadRequestException(string message)
        : base(message)
    {
    }

    protected BadRequestException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public abstract class UnauthorizedException : DomainException
{
    protected UnauthorizedException()
    {
    }

    protected UnauthorizedException(string message)
        : base(message)
    {
    }

    protected UnauthorizedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public abstract class ForbiddenException : DomainException
{
    protected ForbiddenException()
    {
    }

    protected ForbiddenException(string message)
        : base(message)
    {
    }

    protected ForbiddenException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public abstract class NotFoundException : DomainException
{
    protected NotFoundException()
    {
    }

    protected NotFoundException(string message)
        : base(message)
    {
    }

    protected NotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public abstract class ConflictException : DomainException
{
    protected ConflictException()
    {
    }

    protected ConflictException(string message)
        : base(message)
    {
    }

    protected ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
