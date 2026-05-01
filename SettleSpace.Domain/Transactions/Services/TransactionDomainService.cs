using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Domain.Transactions.Services;

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

        if (loggedRole == PersonRole.USER && transaction.Status != TransactionStatus.Pending)
        {
            throw new UnauthorizedTransactionAccessException("You can only update pending transactions.");
        }
    }

    public void EnsureCanDelete(Transaction transaction, string loggedPersonId, PersonRole loggedRole)
    {
        EnsureLoggedPersonId(loggedPersonId);

        if (loggedRole == PersonRole.USER)
        {
            throw new UnauthorizedTransactionAccessException("Users cannot delete transactions.");
        }

        if (loggedRole == PersonRole.ADMIN)
        {
            return;
        }

        if (!transaction.IsCreatedBy(loggedPersonId))
        {
            throw new UnauthorizedTransactionAccessException("You can only delete transactions that you created.");
        }
    }

    public void EnsureCanConfirm(Transaction transaction, string loggedPersonId)
    {
        EnsureLoggedPersonId(loggedPersonId);

        if (transaction.Status != TransactionStatus.Pending)
        {
            throw new UnauthorizedTransactionAccessException("Only pending transactions can be confirmed.");
        }

        if (!transaction.IsUserInvolved(loggedPersonId))
        {
            throw new UnauthorizedTransactionAccessException("You can only confirm transactions where you are the payer or payee.");
        }

        if (transaction.ConfirmedByPersonIds.Contains(loggedPersonId, StringComparer.Ordinal))
        {
            throw new UnauthorizedTransactionAccessException("You have already confirmed this transaction.");
        }
    }

    public void EnsureCanRefuse(Transaction transaction, string loggedPersonId)
    {
        EnsureLoggedPersonId(loggedPersonId);

        if (transaction.Status != TransactionStatus.Pending)
        {
            throw new UnauthorizedTransactionAccessException("Only pending transactions can be refused.");
        }

        if (!transaction.IsUserInvolved(loggedPersonId))
        {
            throw new UnauthorizedTransactionAccessException("You can only refuse transactions where you are the payer or payee.");
        }

        if (transaction.ConfirmedByPersonIds.Contains(loggedPersonId, StringComparer.Ordinal))
        {
            throw new UnauthorizedTransactionAccessException("You have already confirmed this transaction and cannot refuse it.");
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

    private static void EnsureLoggedPersonId(string loggedPersonId)
    {
        if (string.IsNullOrWhiteSpace(loggedPersonId))
        {
            throw new UnauthorizedTransactionAccessException("Authenticated user identifier is required.");
        }
    }
}
