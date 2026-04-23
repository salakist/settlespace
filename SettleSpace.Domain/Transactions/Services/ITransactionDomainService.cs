using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Transactions.Services;

public interface ITransactionDomainService
{
    void EnsureCanCreate(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
    void EnsureCanRead(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
    void EnsureCanUpdate(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
    void EnsureCanDelete(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
    List<Transaction> FilterReadableTransactions(IEnumerable<Transaction> transactions, string loggedPersonId, PersonRole loggedRole);
}
