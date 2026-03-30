using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Domain.Transactions.Exceptions;

namespace FoTestApi.Domain.Transactions.Services
{
    public class TransactionDomainService : ITransactionDomainService
    {
        public void EnsureCanCreate(Transaction transaction, string loggedPersonId)
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

        public void EnsureCanReadOrUpdate(Transaction transaction, string loggedPersonId)
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

        public void EnsureCanDelete(Transaction transaction, string loggedPersonId)
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


