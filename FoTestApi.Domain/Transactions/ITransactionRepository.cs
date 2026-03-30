using FoTestApi.Domain.Transactions.Entities;

namespace FoTestApi.Domain.Transactions
{
    public interface ITransactionRepository
    {
        Task<Transaction?> GetByIdAsync(string id);
        Task<List<Transaction>> GetByInvolvedPersonIdAsync(string personId);
        Task<List<Transaction>> SearchByInvolvedPersonIdAsync(string personId, string query);
        Task<Transaction> AddAsync(Transaction transaction);
        Task UpdateAsync(string id, Transaction transaction);
        Task DeleteAsync(string id);
    }
}


