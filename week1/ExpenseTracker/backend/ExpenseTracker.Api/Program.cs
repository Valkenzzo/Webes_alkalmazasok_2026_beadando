using System.Text.RegularExpressions;
using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "PostgreSQL connection string is missing. Configure ConnectionStrings__Default or user secrets.");
}

builder.Services.AddDbContext<FinanceDbContext>(options => options.UseNpgsql(connectionString));

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/categories", async (FinanceDbContext db, CancellationToken cancellationToken) =>
{
    var categories = await db.Categories
        .AsNoTracking()
        .OrderBy(category => category.SortOrder)
        .ThenBy(category => category.Name)
        .Select(category => new CategoryResponse(category.Id, category.Name, category.Color))
        .ToListAsync(cancellationToken);

    return Results.Ok(categories);
});

app.MapPost("/api/categories", async (
    CreateCategoryRequest request,
    FinanceDbContext db,
    CancellationToken cancellationToken) =>
{
    var name = request.Name?.Trim();
    if (string.IsNullOrWhiteSpace(name) || name.Length > 40
        || request.Color is not { } color || !IsValidColor(color))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["category"] = ["A kategórianév legfeljebb 40 karakter, a szín pedig #RRGGBB formátumú legyen."]
        });
    }

    var normalizedName = name.ToLower();
    var nameExists = await db.Categories.AnyAsync(
        category => category.Name.ToLower() == normalizedName,
        cancellationToken);
    if (nameExists)
    {
        return Results.Conflict(new { error = "Ilyen nevű kategória már létezik." });
    }

    var sortOrder = await db.Categories.Select(category => (int?)category.SortOrder)
        .MaxAsync(cancellationToken) ?? -1;
    var category = new Category
    {
        Id = Guid.NewGuid().ToString("N"),
        Name = name,
        Color = color,
        SortOrder = sortOrder + 1,
    };

    db.Categories.Add(category);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/categories/{category.Id}",
        new CategoryResponse(category.Id, category.Name, category.Color));
});

app.MapPost("/api/categories/import", async (
    ImportCategoriesRequest request,
    FinanceDbContext db,
    CancellationToken cancellationToken) =>
{
    if (request.Categories is null || request.Categories.Count > 100)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["categories"] = ["Legfeljebb 100 kategória importálható egyszerre."]
        });
    }

    if (request.Categories.Any(category =>
            string.IsNullOrWhiteSpace(category.Id)
            || category.Id.Length > 64
            || string.IsNullOrWhiteSpace(category.Name)
            || category.Name.Trim().Length > 40
            || !IsValidColor(category.Color)))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["categories"] = ["Minden kategóriához érvényes azonosító, név és #RRGGBB szín szükséges."]
        });
    }

    var existingIds = await db.Categories.Select(category => category.Id).ToListAsync(cancellationToken);
    var existingNames = await db.Categories.Select(category => category.Name.ToLower()).ToListAsync(cancellationToken);
    var knownIds = existingIds.ToHashSet(StringComparer.Ordinal);
    var knownNames = existingNames.ToHashSet(StringComparer.Ordinal);
    var sortOrder = existingIds.Count == 0
        ? -1
        : await db.Categories.MaxAsync(category => category.SortOrder, cancellationToken);
    var imported = 0;

    foreach (var source in request.Categories)
    {
        var name = source.Name.Trim();
        if (knownIds.Contains(source.Id) || !knownNames.Add(name.ToLower()))
        {
            continue;
        }

        db.Categories.Add(new Category
        {
            Id = source.Id,
            Name = name,
            Color = source.Color,
            SortOrder = ++sortOrder,
        });
        knownIds.Add(source.Id);
        imported++;
    }

    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { imported });
});

app.MapGet("/api/budgets", async (FinanceDbContext db, CancellationToken cancellationToken) =>
{
    var budgets = await db.Budgets
        .AsNoTracking()
        .OrderBy(budget => budget.Category.SortOrder)
        .ThenBy(budget => budget.Category.Name)
        .Select(budget => new BudgetResponse(budget.CategoryId, budget.Limit))
        .ToListAsync(cancellationToken);

    return Results.Ok(budgets);
});

app.MapPut("/api/budgets/{categoryId}", async (
    string categoryId,
    UpdateBudgetRequest request,
    FinanceDbContext db,
    CancellationToken cancellationToken) =>
{
    if (request.Limit <= 0 || request.Limit > 1_000_000_000)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["limit"] = ["A havi keretnek 0 és 1 000 000 000 Ft közé kell esnie."]
        });
    }

    var categoryExists = await db.Categories.AnyAsync(category => category.Id == categoryId, cancellationToken);
    if (!categoryExists)
    {
        return Results.NotFound(new { error = "A kategória nem található." });
    }

    var budget = await db.Budgets.FindAsync([categoryId], cancellationToken);
    if (budget is null)
    {
        budget = new Budget { CategoryId = categoryId, Limit = request.Limit };
        db.Budgets.Add(budget);
    }
    else
    {
        budget.Limit = request.Limit;
    }

    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(new BudgetResponse(budget.CategoryId, budget.Limit));
});

app.MapGet("/api/transactions", async (FinanceDbContext db, CancellationToken cancellationToken) =>
{
    var transactions = await db.Transactions
        .AsNoTracking()
        .OrderByDescending(transaction => transaction.Date)
        .ThenByDescending(transaction => transaction.CreatedAtUtc)
        .Select(transaction => new TransactionResponse(
            transaction.Id,
            transaction.Title,
            transaction.CategoryId,
            transaction.Amount,
            transaction.Date))
        .ToListAsync(cancellationToken);

    return Results.Ok(transactions);
});

app.MapPost("/api/transactions", async (
    CreateTransactionRequest request,
    FinanceDbContext db,
    CancellationToken cancellationToken) =>
{
    var title = request.Title?.Trim();
    if (string.IsNullOrWhiteSpace(title) || title.Length > 80
        || string.IsNullOrWhiteSpace(request.CategoryId) || request.CategoryId.Length > 64
        || request.Amount <= 0 || request.Amount > 1_000_000_000
        || request.Date == default)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["transaction"] = ["Adj meg legfeljebb 80 karakteres nevet, kategóriát, pozitív összeget és érvényes dátumot."]
        });
    }

    var categoryExists = await db.Categories.AnyAsync(
        category => category.Id == request.CategoryId,
        cancellationToken);
    if (!categoryExists)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["categoryId"] = ["A kiválasztott kategória nem található."]
        });
    }

    var transaction = new Transaction
    {
        Id = Guid.NewGuid(),
        Title = title,
        CategoryId = request.CategoryId,
        Amount = request.Amount,
        Date = request.Date,
        CreatedAtUtc = DateTimeOffset.UtcNow,
    };

    db.Transactions.Add(transaction);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/transactions/{transaction.Id}", new TransactionResponse(
        transaction.Id,
        transaction.Title,
        transaction.CategoryId,
        transaction.Amount,
        transaction.Date));
});

app.Run();

static bool IsValidColor(string? color) =>
    color is not null && Regex.IsMatch(color, "^#[0-9A-Fa-f]{6}$");

public sealed record CategoryResponse(string Id, string Name, string Color);
public sealed record CreateCategoryRequest(string? Name, string? Color);
public sealed record ImportCategoryRequest(string Id, string Name, string Color);
public sealed record ImportCategoriesRequest(List<ImportCategoryRequest>? Categories);
public sealed record BudgetResponse(string CategoryId, decimal Limit);
public sealed record UpdateBudgetRequest(decimal Limit);
public sealed record TransactionResponse(Guid Id, string Title, string CategoryId, decimal Amount, DateOnly Date);
public sealed record CreateTransactionRequest(
    string? Title,
    string? CategoryId,
    decimal Amount,
    DateOnly Date);