namespace FoTestApi.Domain.Exceptions
{
    public class TransactionNotFoundException : DomainException
    {
        public TransactionNotFoundException()
        {
        }

        public TransactionNotFoundException(string id)
            : base($"Transaction with ID '{id}' not found.")
        {
        }

        public TransactionNotFoundException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
