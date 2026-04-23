using SettleSpace.Domain.Transactions.Entities;
using SettleSpace.Domain.Transactions;

namespace SettleSpace.Application.Transactions.Queries;

public class TransactionSearchQuery
{
    public string? FreeText { get; set; }
    public List<TransactionStatus>? Status { get; set; }
    public InvolvementType? Involvement { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public List<string>? Involved { get; set; }
    public List<string>? ManagedBy { get; set; }
    public string? Payer { get; set; }
    public string? Payee { get; set; }
}
