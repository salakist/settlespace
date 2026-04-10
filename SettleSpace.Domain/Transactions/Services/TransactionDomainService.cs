using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Domain.Transactions.Services
{
    public class TransactionDomainService : ITransactionDomainService
    {
        public void EnsureCanCreate(Transaction transaction, string loggedPersonId, PersonRole loggedRole)
        {
            EnsureLoggedPersonId(loggedPersonId);

            if (loggedRole.IsStaffRole())
            {
                return;
            }

            if (!transaction.IsUserInvolved(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only create transactions where you are the payer or payee.");
            }
        }

        public void EnsureCanRead(Transaction transaction, string loggedPersonId, PersonRole loggedRole)
        {
            EnsureLoggedPersonId(loggedPersonId);

            if (loggedRole == PersonRole.ADMIN)
            {
                return;
            }

            if (loggedRole == PersonRole.MANAGER)
            {
                if (!transaction.IsUserInvolved(loggedPersonId) && !transaction.IsCreatedBy(loggedPersonId))
                {
                    throw new UnauthorizedTransactionAccessException("Managers can only access transactions where they are involved or creator.");
                }

                return;
            }

            if (!transaction.IsUserInvolved(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only access transactions where you are the payer or payee.");
            }
        }

        public void EnsureCanUpdate(Transaction transaction, string loggedPersonId, PersonRole loggedRole)
        {
            EnsureLoggedPersonId(loggedPersonId);

            if (loggedRole == PersonRole.ADMIN)
            {
                return;
            }

            if (!transaction.IsCreatedBy(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only update transactions that you created.");
            }
        }

        public void EnsureCanDelete(Transaction transaction, string loggedPersonId, PersonRole loggedRole)
        {
            EnsureLoggedPersonId(loggedPersonId);

            if (loggedRole == PersonRole.ADMIN)
            {
                return;
            }

            if (!transaction.IsCreatedBy(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("You can only delete transactions that you created.");
            }
        }

        public List<Transaction> FilterReadableTransactions(IEnumerable<Transaction> transactions, string loggedPersonId, PersonRole loggedRole)
        {
            EnsureLoggedPersonId(loggedPersonId);

            if (loggedRole == PersonRole.ADMIN)
            {
                return [.. transactions];
            }

            if (loggedRole == PersonRole.MANAGER)
            {
                return [.. transactions.Where(transaction => transaction.IsUserInvolved(loggedPersonId) || transaction.IsCreatedBy(loggedPersonId))];
            }

            return [.. transactions.Where(transaction => transaction.IsUserInvolved(loggedPersonId))];
        }

        public List<Transaction> ApplySearchPolicy(List<Transaction> transactions, string loggedPersonId, TransactionSearchPolicy policy)
        {
            var managedByFiltered = FilterByManagedBy(transactions, policy.ManagedBy);
            return FilterByInvolvement(managedByFiltered, loggedPersonId, policy.Involvement);
        }

        private static List<Transaction> FilterByManagedBy(List<Transaction> transactions, List<string>? managedBy)
        {
            if (managedBy is not { Count: > 0 })
            {
                return transactions;
            }

            var managedByIds = managedBy
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.Ordinal);

            if (managedByIds.Count == 0)
            {
                return transactions;
            }

            return [.. transactions
                .Where(t =>
                    !string.IsNullOrWhiteSpace(t.CreatedByPersonId)
                    && managedByIds.Contains(t.CreatedByPersonId)
                    && !t.IsUserInvolved(t.CreatedByPersonId))];
        }

        private static List<Transaction> FilterByInvolvement(List<Transaction> transactions, string loggedPersonId, InvolvementType? involvement)
        {
            return involvement switch
            {
                InvolvementType.Owned => [.. transactions.Where(t => t.IsUserInvolved(loggedPersonId))],
                InvolvementType.Managed => [.. transactions.Where(t => t.IsCreatedBy(loggedPersonId) && !t.IsUserInvolved(loggedPersonId))],
                _ => transactions,
            };
        }

        private static void EnsureLoggedPersonId(string loggedPersonId)
        {
            if (string.IsNullOrWhiteSpace(loggedPersonId))
            {
                throw new UnauthorizedTransactionAccessException("Authenticated user identifier is required.");
            }
        }
    }
}
