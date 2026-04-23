using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Services;

namespace SettleSpace.Application.Transactions.Services;

public class TransactionApplicationService(
    IPersonRepository personRepository,
    ITransactionRepository repository,
    ITransactionDomainService domainService,
    ITransactionMapper transactionMapper) : ITransactionApplicationService
{
    public async Task<List<Transaction>> SearchTransactionsAsync(string loggedPersonId, PersonRole loggedRole, TransactionSearchQuery query)
    {
        var filter = transactionMapper.ToSearchFilter(query, loggedPersonId);
        filter.Validate();
        var transactionSearchTask = repository.SearchAsync(filter);

        if (!string.IsNullOrWhiteSpace(filter.FreeText))
        {
            var personSearchTask = personRepository.SearchAsync(filter.FreeText!);
            await Task.WhenAll(transactionSearchTask, personSearchTask);

            var matchedTransactions = transactionSearchTask.Result;
            var matchedPersonIds = personSearchTask.Result
                .Select(person => person.Id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Cast<string>()
                .ToHashSet(StringComparer.Ordinal);

            if (matchedPersonIds.Count > 0)
            {
                var allFilteredTransactions = await repository.SearchAsync(filter with { FreeText = null });

                matchedTransactions = [.. matchedTransactions
                    .Concat(allFilteredTransactions.Where(transaction =>
                        matchedPersonIds.Contains(transaction.PayerPersonId) ||
                        matchedPersonIds.Contains(transaction.PayeePersonId)))
                    .DistinctBy(BuildSearchResultKey)
                    .OrderByDescending(transaction => transaction.TransactionDateUtc)];
            }

            return domainService.FilterReadableTransactions(matchedTransactions, loggedPersonId, loggedRole);
        }

        var transactions = await transactionSearchTask;
        return domainService.FilterReadableTransactions(transactions, loggedPersonId, loggedRole);
    }

    public async Task<Transaction> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var transaction = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanRead(transaction, loggedPersonId, loggedRole);
        return transaction;
    }

    public async Task<Transaction> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command)
    {
        var transaction = transactionMapper.ToEntity(command, loggedPersonId);
        domainService.EnsureCanCreate(transaction, loggedPersonId, loggedRole);
        transaction.Validate();

        return await repository.AddAsync(transaction);
    }

    public async Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command)
    {
        var existing = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanUpdate(existing, loggedPersonId, loggedRole);

        var updated = transactionMapper.ToEntity(id, command, existing.CreatedByPersonId, existing.CreatedAtUtc);
        domainService.EnsureCanUpdate(updated, loggedPersonId, loggedRole);
        updated.Validate();

        await repository.UpdateAsync(id, updated);
    }

    public async Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var existing = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanDelete(existing, loggedPersonId, loggedRole);
        await repository.DeleteAsync(id);
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
