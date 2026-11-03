namespace ExpenseTracker.Api.Controllers.Contracts;

public sealed record TransactionResponse(
    string Id,
    string CategoryId,
    decimal Amount,
    string Currency,
    string StartedAt,
    string Description);