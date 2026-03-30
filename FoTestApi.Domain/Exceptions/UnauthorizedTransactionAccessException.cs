namespace FoTestApi.Domain.Exceptions
{
    public class UnauthorizedTransactionAccessException : DomainException
    {
        public UnauthorizedTransactionAccessException()
        {
        }

        public UnauthorizedTransactionAccessException(string message)
            : base(message)
        {
        }

        public UnauthorizedTransactionAccessException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
