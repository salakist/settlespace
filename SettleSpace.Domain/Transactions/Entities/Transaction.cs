using SettleSpace.Domain.Transactions.Exceptions;
using System.Text.RegularExpressions;

namespace SettleSpace.Domain.Transactions.Entities;

public partial class Transaction
{
    private const int RegexTimeoutMilliseconds = 1_000;

    [GeneratedRegex("^[A-Z]{3}$", RegexOptions.None, RegexTimeoutMilliseconds)]
    private static partial Regex CurrencyCodePattern();

    public string? Id { get; set; }
    public string PayerPersonId { get; set; } = null!;
    public string PayeePersonId { get; set; } = null!;
    public string CreatedByPersonId { get; set; } = null!;
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "EUR";
    public DateTime TransactionDateUtc { get; set; }
    public string Description { get; set; } = null!;
    public string? Category { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public List<string> ConfirmedByPersonIds { get; set; } = [];
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public bool IsUserInvolved(string personId)
    {
        return string.Equals(PayerPersonId, personId, StringComparison.Ordinal) ||
               string.Equals(PayeePersonId, personId, StringComparison.Ordinal);
    }

    public bool IsCreatedBy(string personId)
    {
        return string.Equals(CreatedByPersonId, personId, StringComparison.Ordinal);
    }

    public void InitializeConfirmations(string creatorPersonId)
    {
        ConfirmedByPersonIds = [];
        if (IsUserInvolved(creatorPersonId))
        {
            ConfirmedByPersonIds.Add(creatorPersonId);
        }
    }

    public bool IsFullyConfirmed()
    {
        return ConfirmedByPersonIds.Contains(PayerPersonId, StringComparer.Ordinal) &&
               ConfirmedByPersonIds.Contains(PayeePersonId, StringComparer.Ordinal);
    }

    public List<string> GetRelatedPersonIds()
    {
        return [PayerPersonId, PayeePersonId, CreatedByPersonId];
    }

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(PayerPersonId))
        {
            throw new InvalidTransactionException("PayerPersonId is required.");
        }

        if (string.IsNullOrWhiteSpace(PayeePersonId))
        {
            throw new InvalidTransactionException("PayeePersonId is required.");
        }

        if (string.IsNullOrWhiteSpace(CreatedByPersonId))
        {
            throw new InvalidTransactionException("CreatedByPersonId is required.");
        }

        if (string.Equals(PayerPersonId, PayeePersonId, StringComparison.Ordinal))
        {
            throw new InvalidTransactionException("PayerPersonId and PayeePersonId must be different.");
        }

        if (Amount <= 0)
        {
            throw new InvalidTransactionException("Amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(CurrencyCode) || !CurrencyCodePattern().IsMatch(CurrencyCode.Trim()))
        {
            throw new InvalidTransactionException("CurrencyCode must be a 3-letter uppercase code.");
        }

        if (string.IsNullOrWhiteSpace(Description))
        {
            throw new InvalidTransactionException("Description is required.");
        }

        if (Description.Trim().Length > 200)
        {
            throw new InvalidTransactionException("Description must be 200 characters or fewer.");
        }

        if (Category?.Length > 80)
        {
            throw new InvalidTransactionException("Category must be 80 characters or fewer.");
        }

        if (TransactionDateUtc > DateTime.UtcNow.AddDays(1))
        {
            throw new InvalidTransactionException("TransactionDateUtc cannot be in the far future.");
        }
    }
}
