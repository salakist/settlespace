using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Domain.Transactions.Services
{
    public interface ITransactionDomainService
    {
        void EnsureCanCreate(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
        void EnsureCanRead(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
        void EnsureCanUpdate(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
        void EnsureCanDelete(Transaction transaction, string loggedPersonId, PersonRole loggedRole);
        List<Transaction> FilterReadableTransactions(IEnumerable<Transaction> transactions, string loggedPersonId, PersonRole loggedRole);
    }
}


