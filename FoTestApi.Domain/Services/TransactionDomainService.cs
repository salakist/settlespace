using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;

namespace FoTestApi.Domain.Services
{
    public class TransactionDomainService : ITransactionDomainService
    {
        public void EnsureCanCreate(TransactionEntity transaction, string loggedPersonId)
        {
            if (string.IsNullOrWhiteSpace(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("Authenticated user identifier is required.");
            }

            if (!transaction.IsUserInvolved(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only create transactions where you are the payer or payee.");
            }
        }

        public void EnsureCanReadOrUpdate(TransactionEntity transaction, string loggedPersonId)
        {
            if (string.IsNullOrWhiteSpace(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("Authenticated user identifier is required.");
            }

            if (!transaction.IsUserInvolved(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only access transactions where you are the payer or payee.");
            }
        }

        public void EnsureCanDelete(TransactionEntity transaction, string loggedPersonId)
        {
            if (string.IsNullOrWhiteSpace(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("Authenticated user identifier is required.");
            }

            if (!transaction.IsCreatedBy(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only delete transactions that you created.");
            }
        }
    }
}
