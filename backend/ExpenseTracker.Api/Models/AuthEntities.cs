using ExpenseTracker.Api.Application.Categorization;

namespace ExpenseTracker.Api.Models;

public enum UserRole { Member, FamilyAdmin }

public enum SuggestionStatus { Pending, Accepted, Overridden, AwaitingApproval, ApprovedNewCategory, RejectedNewCategory }

public sealed class AppUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}

public sealed class CategorySuggestion
{
    public Guid Id { get; set; }
    public Guid RequestedByUserId { get; set; }
    public AppUser RequestedBy { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public SuggestionOutcome Outcome { get; set; }
    public string? SuggestedCategoryId { get; set; }
    public string? ProposedCategoryName { get; set; }
    public double Confidence { get; set; }
    public string Reason { get; set; } = string.Empty;
    public SuggestionStatus Status { get; set; }
    public string? ResolvedCategoryId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public Guid? DecidedByUserId { get; set; }
    public DateTimeOffset? DecidedAtUtc { get; set; }
}
