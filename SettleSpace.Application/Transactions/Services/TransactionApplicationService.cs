using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
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

        public async Task<List<Transaction>> SearchTransactionsAsync(string loggedPersonId, PersonRole loggedRole, TransactionSearchQuery query)
        {
            var freeText = query.FreeText?.Trim();
            var filter = new TransactionSearchFilter
            {
                FreeText = freeText,
                Status = query.Status,
                Category = query.Category,
                Description = query.Description,
                Involved = query.Involved,
                ManagedBy = query.ManagedBy,
                Payer = query.Payer,
                Payee = query.Payee,
            };

            var transactionSearchTask = _repository.SearchAsync(filter);

            List<Transaction> readable;

            if (!string.IsNullOrWhiteSpace(freeText))
            {
                var personSearchTask = _personRepository.SearchAsync(freeText);
                await Task.WhenAll(transactionSearchTask, personSearchTask);

                var matchedTransactions = transactionSearchTask.Result;
                var matchedPersonIds = personSearchTask.Result
                    .Select(person => person.Id)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Cast<string>()
                    .ToHashSet(StringComparer.Ordinal);

                if (matchedPersonIds.Count > 0)
                {
                    var allFilteredTransactions = await _repository.SearchAsync(filter with { FreeText = null });

                    matchedTransactions = [.. matchedTransactions
                        .Concat(allFilteredTransactions.Where(transaction =>
                            matchedPersonIds.Contains(transaction.PayerPersonId) ||
                            matchedPersonIds.Contains(transaction.PayeePersonId)))
                        .DistinctBy(BuildSearchResultKey)
                        .OrderByDescending(transaction => transaction.TransactionDateUtc)];
                }

                readable = _domainService.FilterReadableTransactions(matchedTransactions, loggedPersonId, loggedRole);
            }
            else
            {
                var transactions = await transactionSearchTask;
                readable = _domainService.FilterReadableTransactions(transactions, loggedPersonId, loggedRole);
            }

            var policy = new TransactionSearchPolicy
            {
                ManagedBy = query.ManagedBy,
                Involvement = query.Involvement,
            };
            return _domainService.ApplySearchPolicy(readable, loggedPersonId, policy);
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



