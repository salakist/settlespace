using FoTestApi.Application.Transactions.Commands;
using FoTestApi.Application.Transactions.Mapping;
using FoTestApi.Domain.Persons.Entities;
using FoTestApi.Domain.Transactions.Entities;
using FoTestApi.Domain.Transactions.Exceptions;
using FoTestApi.Domain.Transactions;
using FoTestApi.Domain.Transactions.Services;

namespace FoTestApi.Application.Transactions.Services
{
    public class TransactionApplicationService : ITransactionApplicationService
    {
        private readonly ITransactionRepository _repository;
        private readonly ITransactionDomainService _domainService;
        private readonly ITransactionMapper _transactionMapper;

        public TransactionApplicationService(
            ITransactionRepository repository,
            ITransactionDomainService domainService,
            ITransactionMapper transactionMapper)
        {
            _repository = repository;
            _domainService = domainService;
            _transactionMapper = transactionMapper;
        }

        public async Task<List<Transaction>> GetCurrentUserTransactionsAsync(string loggedPersonId, PersonRole loggedRole)
        {
            var transactions = await _repository.GetAllAsync();
            return _domainService.FilterReadableTransactions(transactions, loggedPersonId, loggedRole);
        }

        public async Task<List<Transaction>> SearchCurrentUserTransactionsAsync(string loggedPersonId, PersonRole loggedRole, string query)
        {
            var transactions = await _repository.SearchAsync(query);
            return _domainService.FilterReadableTransactions(transactions, loggedPersonId, loggedRole);
        }

        public async Task<Transaction> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole)
        {
            var transaction = await _repository.GetByIdAsync(id);
            if (transaction == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanRead(transaction, loggedPersonId, loggedRole);
            return transaction;
        }

        public async Task<Transaction> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command)
        {
            var transaction = _transactionMapper.ToEntity(command, loggedPersonId);
            _domainService.EnsureCanCreate(transaction, loggedPersonId, loggedRole);
            transaction.Validate();

            return await _repository.AddAsync(transaction);
        }

        public async Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanUpdate(existing, loggedPersonId, loggedRole);

            var updated = _transactionMapper.ToEntity(id, command, existing.CreatedByPersonId, existing.CreatedAtUtc);
            _domainService.EnsureCanUpdate(updated, loggedPersonId, loggedRole);
            updated.Validate();

            await _repository.UpdateAsync(id, updated);
        }

        public async Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanDelete(existing, loggedPersonId, loggedRole);
            await _repository.DeleteAsync(id);
        }
    }
}



