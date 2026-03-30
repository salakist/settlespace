using FoTestApi.Application.Commands;
using FoTestApi.Application.Mapping;
using FoTestApi.Domain.Entities;
using FoTestApi.Domain.Exceptions;
using FoTestApi.Domain.Repositories;
using FoTestApi.Domain.Services;

namespace FoTestApi.Application.Services
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

        public async Task<List<TransactionEntity>> GetCurrentUserTransactionsAsync(string loggedPersonId)
        {
            EnsureLoggedPersonId(loggedPersonId);
            return await _repository.GetByInvolvedPersonIdAsync(loggedPersonId);
        }

        public async Task<List<TransactionEntity>> SearchCurrentUserTransactionsAsync(string loggedPersonId, string query)
        {
            EnsureLoggedPersonId(loggedPersonId);
            return await _repository.SearchByInvolvedPersonIdAsync(loggedPersonId, query);
        }

        public async Task<TransactionEntity> GetTransactionByIdAsync(string id, string loggedPersonId)
        {
            EnsureLoggedPersonId(loggedPersonId);

            var transaction = await _repository.GetByIdAsync(id);
            if (transaction == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanReadOrUpdate(transaction, loggedPersonId);
            return transaction;
        }

        public async Task<TransactionEntity> CreateTransactionAsync(string loggedPersonId, CreateTransactionCommand command)
        {
            EnsureLoggedPersonId(loggedPersonId);

            var transaction = _transactionMapper.ToEntity(command, loggedPersonId);
            _domainService.EnsureCanCreate(transaction, loggedPersonId);
            transaction.Validate();

            return await _repository.AddAsync(transaction);
        }

        public async Task UpdateTransactionAsync(string id, string loggedPersonId, UpdateTransactionCommand command)
        {
            EnsureLoggedPersonId(loggedPersonId);

            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanReadOrUpdate(existing, loggedPersonId);

            var updated = _transactionMapper.ToEntity(id, command, existing.CreatedByPersonId, existing.CreatedAtUtc);
            _domainService.EnsureCanReadOrUpdate(updated, loggedPersonId);
            updated.Validate();

            await _repository.UpdateAsync(id, updated);
        }

        public async Task DeleteTransactionAsync(string id, string loggedPersonId)
        {
            EnsureLoggedPersonId(loggedPersonId);

            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
            {
                throw new TransactionNotFoundException(id);
            }

            _domainService.EnsureCanDelete(existing, loggedPersonId);
            await _repository.DeleteAsync(id);
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
