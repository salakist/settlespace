using SettleSpace.Domain.Exceptions;

namespace SettleSpace.Domain.Debts.Exceptions
{
    public class InvalidDebtSettlementException : BadRequestException
    {
        public InvalidDebtSettlementException()
        {
        }

        public InvalidDebtSettlementException(string message)
            : base(message)
        {
        }

        public InvalidDebtSettlementException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
