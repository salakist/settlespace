using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions.Exceptions;

namespace SettleSpace.Domain.Transactions;

public record TransactionSearchFilter
{
    public string? FreeText { get; init; }
    public List<TransactionStatus>? Status { get; init; }
    public string? Category { get; init; }
    public string? Description { get; init; }
    public List<string>? Involved { get; init; }
    public List<string>? ManagedBy { get; init; }
    public string? Payer { get; init; }
    public string? Payee { get; init; }
    public InvolvementType? Involvement { get; init; }
    public string? InvolvementPersonId { get; init; }

    public void Validate()
    {
        ValidateText(FreeText, "FreeText");
        ValidateText(Category, "Category");
        ValidateText(Description, "Description");
        ValidateText(Payer, "Payer");
        ValidateText(Payee, "Payee");
        ValidateStringList(Involved, "Involved");
        ValidateStringList(ManagedBy, "ManagedBy");
        ValidateStatusList(Status);
    }

    private static void ValidateText(string? value, string fieldName)
    {
        if (value is not null && string.IsNullOrWhiteSpace(value))
            throw new InvalidTransactionSearchException($"{fieldName} must not be empty or whitespace.");
    }

    private static void ValidateStringList(List<string>? list, string fieldName)
    {
        if (list is null) return;
        if (list.Count == 0)
            throw new InvalidTransactionSearchException($"{fieldName} list must not be empty.");
        if (list.Any(string.IsNullOrWhiteSpace))
            throw new InvalidTransactionSearchException($"{fieldName} list must not contain empty or whitespace values.");
    }

    private static void ValidateStatusList(List<TransactionStatus>? list)
    {
        if (list?.Count == 0)
            throw new InvalidTransactionSearchException("Status list must not be empty.");
    }
}
