namespace ExpenseTracker.Api.Domain;

public sealed record Transaction(
    Guid Id,
    string CategoryId,
    decimal Amount,
    string Currency,
    DateTimeOffset StartedAt,
    string Description);