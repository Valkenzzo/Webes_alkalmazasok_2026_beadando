using ExpenseTracker.Api.Application.Transactions;
using ExpenseTracker.Api.Data.Mappings;
using Microsoft.EntityFrameworkCore;
using DomainTransaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Data.Repositories;

public sealed class EfTransactionRepository(FinanceDbContext dbContext) : ITransactionRepository
{
    public async Task<IReadOnlyList<DomainTransaction>> ListAsync(CancellationToken cancellationToken)
    {
        var entities = await dbContext.Transactions
            .AsNoTracking()
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return entities.Select(transaction => transaction.ToDomain()).ToArray();
    }
}