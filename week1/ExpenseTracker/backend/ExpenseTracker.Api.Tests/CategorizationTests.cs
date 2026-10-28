using System.Net;
using System.Text;
using System.Text.Json;
using ExpenseTracker.Api.Application.Categorization;
using ExpenseTracker.Api.Infrastructure.OpenAi;
using ExpenseTracker.Api.Infrastructure.Ollama;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ExpenseTracker.Api.Tests;

public sealed class CategorizationTests
{
    private static readonly CategoryOption[] Categories = [new("food", "Élelmiszer"), new("housing", "Lakhatás")];

    [Fact]
    public void Validate_AcceptsExistingCategory()
    {
        var result = SuggestCategoryUseCase.Validate(new("match", "food", null, 0.9, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.Match, result.Outcome);
        Assert.Equal("food", result.CategoryId);
    }

    [Fact]
    public void Validate_RejectsCategoryIdTheModelMadeUp()
    {
        var result = SuggestCategoryUseCase.Validate(new("match", "invented", null, 0.99, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.Uncertain, result.Outcome);
        Assert.Null(result.CategoryId);
    }

    [Fact]
    public void Validate_RejectsLowConfidence()
    {
        var result = SuggestCategoryUseCase.Validate(new("match", "food", null, 0.3, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.Uncertain, result.Outcome);
    }

    [Fact]
    public void Validate_ProposesUnknownCategoryWithoutCreatingIt()
    {
        var result = SuggestCategoryUseCase.Validate(new("new_category", null, "Hobbi", 0.8, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.NewCategory, result.Outcome);
        Assert.Equal("Hobbi", result.ProposedCategoryName);
        Assert.Null(result.CategoryId);
    }

    [Fact]
    public void Validate_MapsProposedNameOfExistingCategoryToMatch()
    {
        var result = SuggestCategoryUseCase.Validate(new("new_category", null, "élelmiszer", 0.8, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.Match, result.Outcome);
        Assert.Equal("food", result.CategoryId);
    }

    [Fact]
    public void Validate_UsesExistingCategoryIdWhenModelAlsoReturnsNewCategory()
    {
        var result = SuggestCategoryUseCase.Validate(
            new("new_category", "food", "Bevásárlás", 0.9, "A kategória már létezik."),
            Categories);

        Assert.Equal(SuggestionOutcome.Match, result.Outcome);
        Assert.Equal("food", result.CategoryId);
        Assert.Null(result.ProposedCategoryName);
    }

    [Fact]
    public void Validate_RejectsTooLongProposedName()
    {
        var result = SuggestCategoryUseCase.Validate(new("new_category", null, new string('x', 41), 0.9, "ok"), Categories);

        Assert.Equal(SuggestionOutcome.Uncertain, result.Outcome);
    }

    [Fact]
    public async Task UseCase_ReturnsUnavailable_WhenCategorizerFails()
    {
        var useCase = new SuggestCategoryUseCase(new FailingCategorizer());

        var result = await useCase.ExecuteAsync("Mozi", 1000m, Categories, CancellationToken.None);

        Assert.Equal(SuggestionOutcome.Unavailable, result.Outcome);
    }

    [Fact]
    public async Task Adapter_ParsesStructuredResponse()
    {
        var content = """{"outcome":"match","categoryId":"food","proposedCategoryName":null,"confidence":0.92,"reason":"Bevásárlás"}""";
        var adapter = Adapter(HttpStatusCode.OK, Completion("stop", content));

        var raw = await adapter.CategorizeAsync("Tesco", 5000m, Categories, CancellationToken.None);

        Assert.Equal("match", raw.Outcome);
        Assert.Equal("food", raw.CategoryId);
        Assert.Equal(0.92, raw.Confidence);
    }

    [Fact]
    public async Task Adapter_ThrowsUnavailable_OnRateLimit() =>
        await Assert.ThrowsAsync<CategorizerUnavailableException>(() =>
            Adapter(HttpStatusCode.TooManyRequests, "{}").CategorizeAsync("t", 1m, Categories, CancellationToken.None));

    [Fact]
    public async Task Adapter_ThrowsUnavailable_WhenResponseIsTruncated() =>
        await Assert.ThrowsAsync<CategorizerUnavailableException>(() =>
            Adapter(HttpStatusCode.OK, Completion("length", "{}")).CategorizeAsync("t", 1m, Categories, CancellationToken.None));

    [Fact]
    public async Task Adapter_ThrowsUnavailable_OnInvalidJson() =>
        await Assert.ThrowsAsync<CategorizerUnavailableException>(() =>
            Adapter(HttpStatusCode.OK, Completion("stop", "not json")).CategorizeAsync("t", 1m, Categories, CancellationToken.None));

    [Fact]
    public async Task Adapter_ThrowsUnavailable_WithoutApiKey() =>
        await Assert.ThrowsAsync<CategorizerUnavailableException>(() =>
            Adapter(HttpStatusCode.OK, "{}", apiKey: null).CategorizeAsync("t", 1m, Categories, CancellationToken.None));

    [Fact]
    public async Task OllamaAdapter_ParsesStructuredResponse()
    {
        const string content = """{"outcome":"match","categoryId":"food","proposedCategoryName":null,"confidence":0.92,"reason":"Bevásárlás"}""";
        var adapter = OllamaAdapter(HttpStatusCode.OK, JsonSerializer.Serialize(new
        {
            message = new { content },
        }));

        var raw = await adapter.CategorizeAsync("Tesco", 5000m, Categories, CancellationToken.None);

        Assert.Equal("match", raw.Outcome);
        Assert.Equal("food", raw.CategoryId);
        Assert.Equal(0.92, raw.Confidence);
    }

    [Fact]
    public async Task OllamaAdapter_ReturnsActionableMessage_WhenModelIsMissing()
    {
        var error = await Assert.ThrowsAsync<CategorizerUnavailableException>(() =>
            OllamaAdapter(HttpStatusCode.NotFound, "{}")
                .CategorizeAsync("t", 1m, Categories, CancellationToken.None));

        Assert.Contains("qwen2.5:3b", error.Message);
    }

    private static string Completion(string finishReason, string content) =>
        JsonSerializer.Serialize(new { choices = new[] { new { finish_reason = finishReason, message = new { content } } } });

    private static OpenAiTransactionCategorizer Adapter(HttpStatusCode status, string body, string? apiKey = "test-key")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["OpenAI:ApiKey"] = apiKey })
            .Build();
        return new(new HttpClient(new StubHandler(status, body)), config, NullLogger<OpenAiTransactionCategorizer>.Instance);
    }

    private static OllamaTransactionCategorizer OllamaAdapter(HttpStatusCode status, string body)
    {
        var config = new ConfigurationBuilder().Build();
        return new(new HttpClient(new StubHandler(status, body)), config, NullLogger<OllamaTransactionCategorizer>.Instance);
    }

    private sealed class FailingCategorizer : ITransactionCategorizer
    {
        public Task<RawSuggestion> CategorizeAsync(
            string title,
            decimal amount,
            IReadOnlyList<CategoryOption> categories,
            CancellationToken cancellationToken) => throw new CategorizerUnavailableException("down");
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
    }
}
