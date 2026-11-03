using System.Globalization;
using ExpenseTracker.Api.Controllers.Contracts;
using DomainTransaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Controllers.Mapping;

public static class TransactionMapping
{
    public static TransactionResponse ToResponse(DomainTransaction transaction) => new(
        transaction.Id.ToString("D").ToLowerInvariant(),
        transaction.CategoryId,
        transaction.Amount,
        transaction.Currency,
        transaction.StartedAt.UtcDateTime.ToString("O", CultureInfo.InvariantCulture),
        transaction.Description);
}