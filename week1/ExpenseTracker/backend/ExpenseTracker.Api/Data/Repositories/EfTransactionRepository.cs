using ExpenseTracker.Api.Application.Transactions;
using ExpenseTracker.Api.Data.Mappings;
using Microsoft.EntityFrameworkCore;
using DomainTransaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Data.Repositories;

public sealed class EfTransactionRepository(FinanceDbContext dbContext) : ITransactionRepository
{
    public async Task<IReadOnlyList<DomainTransaction>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        var entities = await dbContext.Transactions
            .AsNoTracking()
            .Where(transaction => transaction.CreatedByUserId == userId)
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return entities.Select(transaction => transaction.ToDomain()).ToArray();
    }
}