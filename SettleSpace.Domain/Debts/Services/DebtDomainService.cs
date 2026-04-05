using SettleSpace.Domain.Debts.Entities;
using SettleSpace.Domain.Debts.Exceptions;
using SettleSpace.Domain.Transactions.Entities;

namespace SettleSpace.Domain.Debts.Services
{
    public class DebtDomainService : IDebtDomainService
    {
        private const string SettlementCategory = "Settlement";
        private const string DefaultSettlementDescription = "Debt settlement";

        public List<DebtSummary> BuildDebtSummaries(IEnumerable<Transaction> transactions, string currentPersonId)
        {
            EnsureCurrentPersonId(currentPersonId);

            return [.. FilterIncludedTransactions(transactions, currentPersonId)
                .GroupBy(transaction => new
                {
                    CounterpartyPersonId = ResolveCounterpartyPersonId(transaction, currentPersonId),
                    CurrencyCode = NormalizeCurrencyCode(transaction.CurrencyCode),
                })
                .Select(group => BuildSummary(group.Key.CounterpartyPersonId, group.Key.CurrencyCode, currentPersonId, group))
                .OrderBy(summary => summary.CounterpartyPersonId, StringComparer.Ordinal)
                .ThenBy(summary => summary.CurrencyCode, StringComparer.Ordinal)];
        }

        public List<DebtDetails> BuildDebtDetails(IEnumerable<Transaction> transactions, string currentPersonId, string counterpartyPersonId)
        {
            EnsureCurrentPersonId(currentPersonId);
            EnsureCounterpartyPersonId(counterpartyPersonId, currentPersonId);

            return [.. FilterIncludedTransactions(transactions, currentPersonId)
                .Where(transaction => IsPairMatch(transaction, currentPersonId, counterpartyPersonId))
                .GroupBy(transaction => NormalizeCurrencyCode(transaction.CurrencyCode))
                .Select(group => BuildDetails(counterpartyPersonId, group.Key, currentPersonId, group))
                .OrderBy(detail => detail.CurrencyCode, StringComparer.Ordinal)];
        }

        public DebtSettlementResult CreateSettlement(
            IEnumerable<Transaction> transactions,
            string currentPersonId,
            string counterpartyPersonId,
            decimal amount,
            string currencyCode,
            string? description)
        {
            EnsureCurrentPersonId(currentPersonId);
            EnsureCounterpartyPersonId(counterpartyPersonId, currentPersonId);

            if (amount <= 0)
            {
                throw new InvalidDebtSettlementException("Settlement amount must be greater than zero.");
            }

            var normalizedCurrency = NormalizeCurrencyCode(currencyCode);
            var detail = BuildDebtDetails(transactions, currentPersonId, counterpartyPersonId)
                .SingleOrDefault(candidate => string.Equals(candidate.CurrencyCode, normalizedCurrency, StringComparison.Ordinal));

            if (detail == null || detail.NetAmount <= 0 || detail.Direction == DebtDirection.Settled)
            {
                throw new InvalidDebtSettlementException("No outstanding debt exists for the specified counterparty and currency.");
            }

            if (amount > detail.NetAmount)
            {
                throw new InvalidDebtSettlementException("Settlement amount cannot exceed the outstanding debt.");
            }

            var utcNow = DateTime.UtcNow;
            var settlementTransaction = new Transaction
            {
                PayerPersonId = detail.Direction == DebtDirection.YouOweThem ? currentPersonId : counterpartyPersonId,
                PayeePersonId = detail.Direction == DebtDirection.YouOweThem ? counterpartyPersonId : currentPersonId,
                CreatedByPersonId = currentPersonId,
                Amount = amount,
                CurrencyCode = normalizedCurrency,
                TransactionDateUtc = utcNow,
                Description = string.IsNullOrWhiteSpace(description) ? DefaultSettlementDescription : description.Trim(),
                Category = SettlementCategory,
                Status = TransactionStatus.Completed,
                CreatedAtUtc = utcNow,
                UpdatedAtUtc = utcNow,
            };

            settlementTransaction.Validate();

            var remainingNetAmount = detail.NetAmount - amount;

            return new DebtSettlementResult
            {
                CounterpartyPersonId = counterpartyPersonId,
                CurrencyCode = normalizedCurrency,
                SettledAmount = amount,
                RemainingNetAmount = remainingNetAmount,
                Direction = remainingNetAmount == 0 ? DebtDirection.Settled : detail.Direction,
                SettlementTransaction = settlementTransaction,
            };
        }

        private static IEnumerable<Transaction> FilterIncludedTransactions(IEnumerable<Transaction> transactions, string currentPersonId)
        {
            return transactions.Where(transaction =>
                transaction.Status == TransactionStatus.Completed &&
                transaction.IsUserInvolved(currentPersonId));
        }

        private static DebtSummary BuildSummary(
            string counterpartyPersonId,
            string currencyCode,
            string currentPersonId,
            IEnumerable<Transaction> transactions)
        {
            var transactionList = transactions.ToList();
            var paidByCurrentPerson = transactionList
                .Where(transaction => string.Equals(transaction.PayerPersonId, currentPersonId, StringComparison.Ordinal))
                .Sum(transaction => transaction.Amount);
            var paidByCounterparty = transactionList
                .Where(transaction => string.Equals(transaction.PayerPersonId, counterpartyPersonId, StringComparison.Ordinal))
                .Sum(transaction => transaction.Amount);
            var signedNet = paidByCurrentPerson - paidByCounterparty;

            return new DebtSummary
            {
                CounterpartyPersonId = counterpartyPersonId,
                CurrencyCode = currencyCode,
                NetAmount = Math.Abs(signedNet),
                Direction = ResolveDirection(signedNet),
                TransactionCount = transactionList.Count,
            };
        }

        private static DebtDetails BuildDetails(
            string counterpartyPersonId,
            string currencyCode,
            string currentPersonId,
            IEnumerable<Transaction> transactions)
        {
            var transactionList = transactions.OrderByDescending(transaction => transaction.TransactionDateUtc).ToList();
            var paidByCurrentPerson = transactionList
                .Where(transaction => string.Equals(transaction.PayerPersonId, currentPersonId, StringComparison.Ordinal))
                .Sum(transaction => transaction.Amount);
            var paidByCounterparty = transactionList
                .Where(transaction => !string.Equals(transaction.PayerPersonId, currentPersonId, StringComparison.Ordinal))
                .Sum(transaction => transaction.Amount);
            var signedNet = paidByCurrentPerson - paidByCounterparty;

            return new DebtDetails
            {
                CounterpartyPersonId = counterpartyPersonId,
                CurrencyCode = currencyCode,
                NetAmount = Math.Abs(signedNet),
                Direction = ResolveDirection(signedNet),
                TransactionCount = transactionList.Count,
                PaidByCurrentPerson = paidByCurrentPerson,
                PaidByCounterparty = paidByCounterparty,
                Transactions = transactionList,
            };
        }

        private static string ResolveCounterpartyPersonId(Transaction transaction, string currentPersonId)
        {
            return string.Equals(transaction.PayerPersonId, currentPersonId, StringComparison.Ordinal)
                ? transaction.PayeePersonId
                : transaction.PayerPersonId;
        }

        private static bool IsPairMatch(Transaction transaction, string currentPersonId, string counterpartyPersonId)
        {
            return (string.Equals(transaction.PayerPersonId, currentPersonId, StringComparison.Ordinal) &&
                    string.Equals(transaction.PayeePersonId, counterpartyPersonId, StringComparison.Ordinal)) ||
                   (string.Equals(transaction.PayerPersonId, counterpartyPersonId, StringComparison.Ordinal) &&
                    string.Equals(transaction.PayeePersonId, currentPersonId, StringComparison.Ordinal));
        }

        private static DebtDirection ResolveDirection(decimal signedNet)
        {
            if (signedNet > 0)
            {
                return DebtDirection.TheyOweYou;
            }

            if (signedNet < 0)
            {
                return DebtDirection.YouOweThem;
            }

            return DebtDirection.Settled;
        }

        private static string NormalizeCurrencyCode(string currencyCode)
        {
            var normalized = currencyCode?.Trim().ToUpperInvariant() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new InvalidDebtSettlementException("CurrencyCode is required.");
            }

            return normalized;
        }

        private static void EnsureCurrentPersonId(string currentPersonId)
        {
            if (string.IsNullOrWhiteSpace(currentPersonId))
            {
                throw new InvalidDebtSettlementException("Authenticated user identifier is required.");
            }
        }

        private static void EnsureCounterpartyPersonId(string counterpartyPersonId, string currentPersonId)
        {
            if (string.IsNullOrWhiteSpace(counterpartyPersonId))
            {
                throw new InvalidDebtSettlementException("CounterpartyPersonId is required.");
            }

            if (string.Equals(counterpartyPersonId, currentPersonId, StringComparison.Ordinal))
            {
                throw new InvalidDebtSettlementException("CounterpartyPersonId must be different from the authenticated user.");
            }
        }
    }
}
