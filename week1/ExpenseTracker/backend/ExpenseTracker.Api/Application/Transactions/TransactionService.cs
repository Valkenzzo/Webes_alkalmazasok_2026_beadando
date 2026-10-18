using Transaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Application.Transactions;

public sealed class TransactionService(ITransactionRepository repository) : ITransactionService
{
    public Task<IReadOnlyList<Transaction>> ListTransactionsAsync(CancellationToken cancellationToken) =>
        repository.ListAsync(cancellationToken);
}