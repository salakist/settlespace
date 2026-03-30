using FoTestApi.Domain.Entities;

namespace FoTestApi.Domain.Services
{
    public interface ITransactionDomainService
    {
        void EnsureCanCreate(TransactionEntity transaction, string loggedPersonId);
        void EnsureCanReadOrUpdate(TransactionEntity transaction, string loggedPersonId);
        void EnsureCanDelete(TransactionEntity transaction, string loggedPersonId);
    }
}
