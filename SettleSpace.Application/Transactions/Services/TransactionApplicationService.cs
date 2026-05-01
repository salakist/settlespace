using SettleSpace.Application.Persons.Services;
using SettleSpace.Application.Transactions.Commands;
using SettleSpace.Application.Transactions.Queries;
using SettleSpace.Application.Transactions.Mapping;
using SettleSpace.Domain.Persons;
using SettleSpace.Domain.Persons.Entities;
using SettleSpace.Domain.Transactions.Exceptions;
using SettleSpace.Domain.Transactions;
using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Services;

namespace SettleSpace.Application.Transactions.Services;

public class TransactionApplicationService(
    IPersonRepository personRepository,
    ITransactionRepository repository,
    ITransactionDomainService domainService,
    ITransactionMapper transactionMapper,
    IPersonDisplayNameResolver personDisplayNameResolver) : ITransactionApplicationService
{
    public async Task<List<TransactionDto>> SearchTransactionsAsync(string loggedPersonId, PersonRole loggedRole, TransactionSearchQuery query)
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
        var readable = domainService.FilterReadableTransactions(transactions, loggedPersonId, loggedRole);
        var relatedPersonIds = readable.SelectMany(t => t.GetRelatedPersonIds()).ToList();
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(relatedPersonIds);

        return readable.ConvertAll(t => transactionMapper.ToDto(t, personDisplayNames));
    }

    public async Task<TransactionDto> GetTransactionByIdAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var transaction = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanRead(transaction, loggedPersonId, loggedRole);
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(transaction.GetRelatedPersonIds());

        return transactionMapper.ToDto(transaction, personDisplayNames);
    }

    public async Task<TransactionDto> CreateTransactionAsync(string loggedPersonId, PersonRole loggedRole, CreateTransactionCommand command)
    {
        var transaction = transactionMapper.ToEntity(command, loggedPersonId);

        if (loggedRole != PersonRole.ADMIN)
        {
            transaction.Status = TransactionStatus.Pending;
        }

        transaction.InitializeConfirmations(loggedPersonId);
        domainService.EnsureCanCreate(transaction, loggedPersonId, loggedRole);
        transaction.Validate();

        var created = await repository.AddAsync(transaction);
        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(created.GetRelatedPersonIds());

        return transactionMapper.ToDto(created, personDisplayNames);
    }

    public async Task UpdateTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole, UpdateTransactionCommand command)
    {
        var existing = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanUpdate(existing, loggedPersonId, loggedRole);

        var updated = transactionMapper.ToEntity(id, command, existing.CreatedByPersonId, existing.CreatedAtUtc);

        if (loggedRole != PersonRole.ADMIN)
        {
            updated.Status = existing.Status;
        }

        if (existing.Status == TransactionStatus.Pending)
        {
            updated.InitializeConfirmations(existing.CreatedByPersonId);
        }
        else
        {
            updated.ConfirmedByPersonIds = existing.ConfirmedByPersonIds;
        }

        domainService.EnsureCanUpdate(updated, loggedPersonId, loggedRole);
        updated.Validate();

        await repository.UpdateAsync(id, updated);
    }

    public async Task<TransactionDto> ConfirmTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var transaction = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanRead(transaction, loggedPersonId, loggedRole);
        domainService.EnsureCanConfirm(transaction, loggedPersonId);

        transaction.ConfirmedByPersonIds.Add(loggedPersonId);

        if (transaction.IsFullyConfirmed())
        {
            transaction.Status = TransactionStatus.Completed;
        }

        transaction.UpdatedAtUtc = DateTime.UtcNow;
        await repository.UpdateAsync(id, transaction);

        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(transaction.GetRelatedPersonIds());
        return transactionMapper.ToDto(transaction, personDisplayNames);
    }

    public async Task<TransactionDto> RefuseTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var transaction = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanRead(transaction, loggedPersonId, loggedRole);
        domainService.EnsureCanRefuse(transaction, loggedPersonId);

        transaction.Status = TransactionStatus.Cancelled;
        transaction.UpdatedAtUtc = DateTime.UtcNow;
        await repository.UpdateAsync(id, transaction);

        var personDisplayNames = await personDisplayNameResolver.ResolveAsync(transaction.GetRelatedPersonIds());
        return transactionMapper.ToDto(transaction, personDisplayNames);
    }

    public async Task DeleteTransactionAsync(string id, string loggedPersonId, PersonRole loggedRole)
    {
        var existing = await repository.GetByIdAsync(id) ?? throw new TransactionNotFoundException(id);
        domainService.EnsureCanDelete(existing, loggedPersonId, loggedRole);
        await repository.DeleteAsync(id);
    }
}
