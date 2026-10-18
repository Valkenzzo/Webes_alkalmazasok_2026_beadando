using Transaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Application.Transactions;

public interface ITransactionService
{
    Task<IReadOnlyList<Transaction>> ListTransactionsAsync(CancellationToken cancellationToken);
}