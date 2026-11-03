using ExpenseTracker.Api.Models;
using DomainTransaction = ExpenseTracker.Api.Domain.Transaction;

namespace ExpenseTracker.Api.Data.Mappings;

internal static class TransactionEntityMapping
{
    public static DomainTransaction ToDomain(this Models.Transaction entity) => new(
        entity.Id,
        entity.CategoryId,
        entity.Amount,
        "HUF",
        new DateTimeOffset(entity.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)),
        entity.Title);
}