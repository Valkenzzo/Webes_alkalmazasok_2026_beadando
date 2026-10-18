using ExpenseTracker.Api.Application.Transactions;
using ExpenseTracker.Api.Controllers;
using ExpenseTracker.Api.Controllers.Contracts;
using ExpenseTracker.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace ExpenseTracker.Api.Tests;

public sealed class TransactionsControllerTests
{
    [Fact]
    public async Task Get_ReturnsTwoMappedTransactionsAsOk()
    {
        var startedAt = new DateTimeOffset(2026, 10, 18, 10, 30, 0, TimeSpan.Zero);
        var service = new StubTransactionService(
        [
            new Transaction(Guid.Parse("550e8400-e29b-41d4-a716-446655440000"), "food", 2499m, "HUF", startedAt, "Bevásárlás"),
            new Transaction(Guid.Parse("2f1a2c9d-88d6-4f18-a2d0-9e5e1a7b3c40"), "housing", 185000m, "HUF", startedAt.AddDays(-1), "Havi albérlet"),
        ]);
        var controller = new TransactionsController(service);

        var action = await controller.Get(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsAssignableFrom<IReadOnlyList<TransactionResponse>>(result.Value);
        Assert.Equal(2, response.Count);
        Assert.Equal("550e8400-e29b-41d4-a716-446655440000", response[0].Id);
        Assert.Equal("food", response[0].CategoryId);
        Assert.Equal(2499m, response[0].Amount);
        Assert.Equal("HUF", response[0].Currency);
        Assert.Equal("2026-10-18T10:30:00.0000000Z", response[0].StartedAt);
        Assert.Equal("Bevásárlás", response[0].Description);
    }

    [Fact]
    public async Task Get_ReturnsOkWithEmptyArrayWhenNoTransactionsExist()
    {
        var controller = new TransactionsController(new StubTransactionService([]));

        var action = await controller.Get(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsAssignableFrom<IReadOnlyList<TransactionResponse>>(result.Value);
        Assert.Empty(response);
    }

    private sealed class StubTransactionService(IReadOnlyList<Transaction> transactions) : ITransactionService
    {
        public Task<IReadOnlyList<Transaction>> ListTransactionsAsync(CancellationToken cancellationToken) =>
            Task.FromResult(transactions);
    }
}