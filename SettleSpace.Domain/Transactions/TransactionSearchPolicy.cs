namespace SettleSpace.Domain.Transactions;

public class TransactionSearchPolicy
{
    public List<string>? ManagedBy { get; init; }
    public InvolvementType? Involvement { get; init; }
}
