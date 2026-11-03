using Transaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Application.Transactions;

public sealed class TransactionService(ITransactionRepository repository) : ITransactionService
{
    public Task<IReadOnlyList<Transaction>> ListTransactionsAsync(Guid userId, CancellationToken cancellationToken) =>
        repository.ListAsync(userId, cancellationToken);
}