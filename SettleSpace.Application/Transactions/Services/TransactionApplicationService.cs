using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Services;

namespace SettleSpace.Application.Transactions.Services
{
    public class TransactionApplicationService : ITransactionApplicationService
    {
        private readonly IPersonRepository _personRepository;
        private readonly ITransactionRepository _repository;
        private readonly ITransactionDomainService _domainService;
        private readonly ITransactionMapper _transactionMapper;

        public TransactionApplicationService(
            IPersonRepository personRepository,
            ITransactionRepository repository,
            ITransactionDomainService domainService,
            ITransactionMapper transactionMapper)
        {
            _personRepository = personRepository;
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
            var transactions = await SearchTransactionsIncludingInvolvedPersonsAsync(query);
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

        private async Task<List<Transaction>> SearchTransactionsIncludingInvolvedPersonsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await _repository.GetAllAsync();
            }

            var transactionSearchTask = _repository.SearchAsync(query);
            var personSearchTask = _personRepository.SearchAsync(query);

            await Task.WhenAll(transactionSearchTask, personSearchTask);

            var matchedTransactions = transactionSearchTask.Result;
            var matchedPersonIds = personSearchTask.Result
                .Select(person => person.Id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Cast<string>()
                .ToHashSet(StringComparer.Ordinal);

            if (matchedPersonIds.Count == 0)
            {
                return matchedTransactions;
            }

            var allTransactions = await _repository.GetAllAsync();

            return [.. matchedTransactions
                .Concat(allTransactions.Where(transaction =>
                    matchedPersonIds.Contains(transaction.PayerPersonId) ||
                    matchedPersonIds.Contains(transaction.PayeePersonId)))
                .DistinctBy(BuildSearchResultKey)
                .OrderByDescending(transaction => transaction.TransactionDateUtc)];
        }

        private static string BuildSearchResultKey(Transaction transaction)
        {
            return transaction.Id ?? string.Join("|",
                transaction.PayerPersonId,
                transaction.PayeePersonId,
                transaction.CreatedByPersonId,
                transaction.TransactionDateUtc.ToString("O"),
                transaction.Description,
                transaction.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }
    }
}



