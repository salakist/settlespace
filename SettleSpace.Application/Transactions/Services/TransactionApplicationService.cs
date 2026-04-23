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

        if (!string.IsNullOrWhiteSpace(filter.FreeText))
        {
            var personIds = (await personRepository.SearchAsync(filter.FreeText))
                .Select(person => person.Id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Cast<string>()
                .ToList();

            if (personIds.Count > 0)
                filter = filter with { FreeTextPersonIds = personIds };
        }

        var transactions = await repository.SearchAsync(filter);
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
}
