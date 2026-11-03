namespace ExpenseTracker.Api.Application.Categorization;

public enum SuggestionOutcome { Match, NewCategory, Uncertain, Unavailable }

public sealed record CategoryOption(string Id, string Name);

public sealed record RawSuggestion(string Outcome, string? CategoryId, string? ProposedCategoryName, double Confidence, string Reason);

public sealed record SuggestionResult(
    SuggestionOutcome Outcome,
    string? CategoryId,
    string? ProposedCategoryName,
    double Confidence,
    string Reason);

public sealed class CategorizerUnavailableException(string message, Exception? inner = null)
    : Exception(message, inner);

public interface ITransactionCategorizer
{
    Task<RawSuggestion> CategorizeAsync(
        string title,
        decimal amount,
        IReadOnlyList<CategoryOption> categories,
        CancellationToken cancellationToken);
}

public sealed class SuggestCategoryUseCase(ITransactionCategorizer categorizer)
{
    public const double MinConfidence = 0.6;
    public const int MaxNameLength = 40;

    public async Task<SuggestionResult> ExecuteAsync(
        string title,
        decimal amount,
        IReadOnlyList<CategoryOption> categories,
        CancellationToken cancellationToken)
    {
        RawSuggestion raw;
        try
        {
            raw = await categorizer.CategorizeAsync(title, amount, categories, cancellationToken);
        }
        catch (CategorizerUnavailableException exception)
        {
            return new(SuggestionOutcome.Unavailable, null, null, 0, exception.Message);
        }

        return Validate(raw, categories);
    }

    // The model output is untrusted: only categories that exist right now may become a Match.
    public static SuggestionResult Validate(RawSuggestion raw, IReadOnlyList<CategoryOption> categories)
    {
        var confidence = double.IsFinite(raw.Confidence) ? Math.Clamp(raw.Confidence, 0, 1) : 0;
        var reason = (raw.Reason ?? string.Empty).Trim();
        if (reason.Length > 200) reason = reason[..200];

        var uncertain = new SuggestionResult(SuggestionOutcome.Uncertain, null, null, confidence, reason);
        var other = categories.FirstOrDefault(category => category.Id == "other");
        var fallback = other is null
            ? uncertain
            : new SuggestionResult(
                SuggestionOutcome.Match,
                other.Id,
                null,
                confidence,
                "Nem sikerült egyértelműen besorolni; javaslat: Egyéb.");

        if (confidence < MinConfidence || raw.Outcome != "match") return fallback;

        return categories.Any(category => category.Id == raw.CategoryId)
            ? new(SuggestionOutcome.Match, raw.CategoryId, null, confidence, reason)
            : fallback;
    }
}
