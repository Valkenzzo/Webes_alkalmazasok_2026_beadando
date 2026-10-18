using Transaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Application.Transactions;

public interface ITransactionRepository
{
    Task<IReadOnlyList<Transaction>> ListAsync(CancellationToken cancellationToken);
}