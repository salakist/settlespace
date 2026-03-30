using FoTestApi.Domain.Entities;

namespace FoTestApi.Domain.Repositories
{
    public interface ITransactionRepository
    {
        Task<TransactionEntity?> GetByIdAsync(string id);
        Task<List<TransactionEntity>> GetByInvolvedPersonIdAsync(string personId);
        Task<List<TransactionEntity>> SearchByInvolvedPersonIdAsync(string personId, string query);
        Task<TransactionEntity> AddAsync(TransactionEntity transaction);
        Task UpdateAsync(string id, TransactionEntity transaction);
        Task DeleteAsync(string id);
    }
}
