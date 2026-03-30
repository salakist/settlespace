using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Domain.Transactions.Services
{
    public interface ITransactionDomainService
    {
        void EnsureCanCreate(Transaction transaction, string loggedPersonId);
        void EnsureCanReadOrUpdate(Transaction transaction, string loggedPersonId);
        void EnsureCanDelete(Transaction transaction, string loggedPersonId);
    }
}


