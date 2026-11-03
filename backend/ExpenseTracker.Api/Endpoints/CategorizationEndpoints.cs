using System.Security.Claims;
using System.Text.RegularExpressions;
using ExpenseTracker.Api.Application.Categorization;
using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Endpoints;

public sealed record SuggestionRequest(string? Title, decimal Amount);
public sealed record SuggestionResponse(
    Guid? SuggestionId,
    string Outcome,
    string? CategoryId,
    string? ProposedCategoryName,
    double Confidence,
    string Reason);
public sealed record PendingProposal(Guid Id, string ProposedCategoryName, string Title, string RequestedBy);
public sealed record ApproveRequest(string? Name, string? Color);

public static class CategorizationEndpoints
{
    private static readonly Regex ColorPattern = new("^#[0-9A-Fa-f]{6}$");

    public static void MapCategorizationEndpoints(this WebApplication app)
    {
        app.MapPost("/api/transactions/category-suggestions", async (
            SuggestionRequest request,
            ClaimsPrincipal principal,
            FinanceDbContext db,
            SuggestCategoryUseCase useCase,
            CancellationToken ct) =>
        {
            var title = request.Title?.Trim();
            if (string.IsNullOrWhiteSpace(title) || title.Length > 80 || request.Amount <= 0 || request.Amount > 1_000_000_000)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["suggestion"] = ["Adj meg legfeljebb 80 karakteres nevet és pozitív összeget."]
                });
            }

            if (principal.UserId() is not { } userId) return Results.Unauthorized();

            var categories = await db.Categories.AsNoTracking()
                .OrderBy(category => category.SortOrder)
                .Select(category => new CategoryOption(category.Id, category.Name))
                .ToListAsync(ct);
            var result = await useCase.ExecuteAsync(title, request.Amount, categories, ct);

            if (result.Outcome == SuggestionOutcome.Unavailable)
            {
                return Results.Ok(new SuggestionResponse(null, result.Outcome.ToString(), null, null, 0, result.Reason));
            }

            var suggestion = new CategorySuggestion
            {
                Id = Guid.NewGuid(),
                RequestedByUserId = userId,
                Title = title,
                Amount = request.Amount,
                Outcome = result.Outcome,
                SuggestedCategoryId = result.CategoryId,
                ProposedCategoryName = result.ProposedCategoryName,
                Confidence = result.Confidence,
                Reason = result.Reason,
                Status = SuggestionStatus.Pending,
                CreatedAtUtc = DateTimeOffset.UtcNow,
            };
            db.CategorySuggestions.Add(suggestion);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new SuggestionResponse(
                suggestion.Id,
                result.Outcome.ToString(),
                result.CategoryId,
                result.ProposedCategoryName,
                result.Confidence,
                result.Reason));
        }).RequireRateLimiting("suggestions");

        app.MapPost("/api/category-suggestions/{id:guid}/propose-category", async (
            Guid id,
            ClaimsPrincipal principal,
            FinanceDbContext db,
            CancellationToken ct) =>
        {
            var suggestion = await db.CategorySuggestions.FindAsync([id], ct);
            if (suggestion is null || suggestion.RequestedByUserId != principal.UserId()) return Results.NotFound();
            if (suggestion.Outcome != SuggestionOutcome.NewCategory || suggestion.Status != SuggestionStatus.Pending)
            {
                return Results.Conflict(new { error = "A javaslat nem küldhető jóváhagyásra." });
            }

            suggestion.Status = SuggestionStatus.AwaitingApproval;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        app.MapGet("/api/category-suggestions/pending", async (FinanceDbContext db, CancellationToken ct) =>
            Results.Ok(await db.CategorySuggestions.AsNoTracking()
                .Where(suggestion => suggestion.Status == SuggestionStatus.AwaitingApproval)
                .OrderBy(suggestion => suggestion.CreatedAtUtc)
                .Select(suggestion => new PendingProposal(
                    suggestion.Id,
                    suggestion.ProposedCategoryName!,
                    suggestion.Title,
                    suggestion.RequestedBy.DisplayName))
                .ToListAsync(ct))).RequireAuthorization("FamilyAdmin");

        app.MapPost("/api/category-suggestions/{id:guid}/approve", async (
            Guid id,
            ApproveRequest request,
            ClaimsPrincipal principal,
            FinanceDbContext db,
            CancellationToken ct) =>
        {
            var suggestion = await db.CategorySuggestions.FindAsync([id], ct);
            if (suggestion is null) return Results.NotFound();
            if (suggestion.Status != SuggestionStatus.AwaitingApproval)
            {
                return Results.Conflict(new { error = "A javaslat már elbírált." });
            }

            var name = (request.Name ?? suggestion.ProposedCategoryName)?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > SuggestCategoryUseCase.MaxNameLength
                || request.Color is not { } color || !ColorPattern.IsMatch(color))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["category"] = ["A kategórianév legfeljebb 40 karakter, a szín pedig #RRGGBB formátumú legyen."]
                });
            }

            var lowered = name.ToLower();
            if (await db.Categories.AnyAsync(category => category.Name.ToLower() == lowered, ct))
            {
                return Results.Conflict(new { error = "Ilyen nevű kategória már létezik." });
            }

            var sortOrder = (await db.Categories.MaxAsync(category => (int?)category.SortOrder, ct) ?? -1) + 1;
            var created = new Category { Id = Guid.NewGuid().ToString("N"), Name = name, Color = color, SortOrder = sortOrder };
            db.Categories.Add(created);

            suggestion.Status = SuggestionStatus.ApprovedNewCategory;
            suggestion.ResolvedCategoryId = created.Id;
            suggestion.DecidedByUserId = principal.UserId();
            suggestion.DecidedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new CategoryResponse(created.Id, created.Name, created.Color));
        }).RequireAuthorization("FamilyAdmin");

        app.MapPost("/api/category-suggestions/{id:guid}/reject", async (
            Guid id,
            ClaimsPrincipal principal,
            FinanceDbContext db,
            CancellationToken ct) =>
        {
            var suggestion = await db.CategorySuggestions.FindAsync([id], ct);
            if (suggestion is null) return Results.NotFound();
            if (suggestion.Status != SuggestionStatus.AwaitingApproval)
            {
                return Results.Conflict(new { error = "A javaslat már elbírált." });
            }

            suggestion.Status = SuggestionStatus.RejectedNewCategory;
            suggestion.DecidedByUserId = principal.UserId();
            suggestion.DecidedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        }).RequireAuthorization("FamilyAdmin");
    }

    // A suggestion may only be consumed by its owner, once, and only for a category that exists.
    public static async Task<(string? Error, string Source)> ResolveSuggestionAsync(
        FinanceDbContext db,
        Guid? suggestionId,
        Guid userId,
        string categoryId,
        CancellationToken ct)
    {
        if (suggestionId is null) return (null, "Manual");

        var suggestion = await db.CategorySuggestions.FindAsync([suggestionId.Value], ct);
        if (suggestion is null || suggestion.RequestedByUserId != userId) return ("A javaslat nem található.", "Manual");

        if (suggestion.Status == SuggestionStatus.Pending && suggestion.Outcome == SuggestionOutcome.Match)
        {
            var accepted = suggestion.SuggestedCategoryId == categoryId;
            suggestion.Status = accepted ? SuggestionStatus.Accepted : SuggestionStatus.Overridden;
            return (null, accepted ? "AiApproved" : "Manual");
        }

        if (suggestion.Status == SuggestionStatus.ApprovedNewCategory && suggestion.ResolvedCategoryId == categoryId)
        {
            suggestion.Status = SuggestionStatus.Accepted;
            return (null, "AiApproved");
        }

        return ("A javaslat már nem használható.", "Manual");
    }
}
