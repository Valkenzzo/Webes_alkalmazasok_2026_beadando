namespace ExpenseTracker.Api.Models;

public sealed class Category
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    public int SortOrder { get; set; }
    public List<Transaction> Transactions { get; set; } = [];
    public Budget? Budget { get; set; }
}

public sealed class Transaction
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public Category Category { get; set; } = null!;
}

public sealed class Budget
{
    public string CategoryId { get; set; } = string.Empty;
    public decimal Limit { get; set; }
    public Category Category { get; set; } = null!;
}