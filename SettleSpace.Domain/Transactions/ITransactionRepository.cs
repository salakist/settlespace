using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Transactions
{
    public interface ITransactionRepository
    {
        Task<List<Transaction>> GetAllAsync();
        Task<List<Transaction>> SearchAsync(string query);
        Task<List<Transaction>> SearchAsync(TransactionSearchFilter filter);
        Task<Transaction?> GetByIdAsync(string id);
        Task<List<Transaction>> GetByInvolvedPersonIdAsync(string personId);
        Task<List<Transaction>> SearchByInvolvedPersonIdAsync(string personId, string query);
        Task<Transaction> AddAsync(Transaction transaction);
        Task UpdateAsync(string id, Transaction transaction);
        Task DeleteAsync(string id);
    }
}


