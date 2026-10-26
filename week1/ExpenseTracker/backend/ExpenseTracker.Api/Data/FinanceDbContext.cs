using ExpenseTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Api.Data;

public sealed class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<CategorySuggestion> CategorySuggestions => Set<CategorySuggestion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(category => category.Id);
            entity.Property(category => category.Id).HasMaxLength(64);
            entity.Property(category => category.Name).HasMaxLength(40).IsRequired();
            entity.Property(category => category.Color).HasMaxLength(7).IsRequired();
            entity.HasIndex(category => category.Name).IsUnique();
            entity.HasData(
                new Category { Id = "food", Name = "Élelmiszer", Color = "#f59e0b", SortOrder = 0 },
                new Category { Id = "housing", Name = "Lakhatás", Color = "#6366f1", SortOrder = 1 },
                new Category { Id = "transport", Name = "Közlekedés", Color = "#0ea5e9", SortOrder = 2 },
                new Category { Id = "leisure", Name = "Szórakozás", Color = "#ec4899", SortOrder = 3 },
                new Category { Id = "health", Name = "Egészség", Color = "#10b981", SortOrder = 4 },
                new Category { Id = "other", Name = "Egyéb", Color = "#64748b", SortOrder = 5 });
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(transaction => transaction.Id);
            entity.Property(transaction => transaction.Title).HasMaxLength(80).IsRequired();
            entity.Property(transaction => transaction.CategoryId).HasMaxLength(64).IsRequired();
            entity.Property(transaction => transaction.Amount).HasPrecision(18, 2);
            entity.Property(transaction => transaction.Date).HasColumnType("date");
            entity.Property(transaction => transaction.CategorySource).HasMaxLength(20).HasDefaultValue("Manual");
            entity.HasOne(transaction => transaction.Category)
                .WithMany(category => category.Transactions)
                .HasForeignKey(transaction => transaction.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(254).IsRequired();
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.DisplayName).HasMaxLength(60).IsRequired();
            entity.Property(user => user.PasswordHash).IsRequired();
            entity.Property(user => user.Role).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<CategorySuggestion>(entity =>
        {
            entity.HasKey(suggestion => suggestion.Id);
            entity.Property(suggestion => suggestion.Title).HasMaxLength(80).IsRequired();
            entity.Property(suggestion => suggestion.Amount).HasPrecision(18, 2);
            entity.Property(suggestion => suggestion.Outcome).HasConversion<string>().HasMaxLength(20);
            entity.Property(suggestion => suggestion.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(suggestion => suggestion.SuggestedCategoryId).HasMaxLength(64);
            entity.Property(suggestion => suggestion.ProposedCategoryName).HasMaxLength(40);
            entity.Property(suggestion => suggestion.ResolvedCategoryId).HasMaxLength(64);
            entity.Property(suggestion => suggestion.Reason).HasMaxLength(200).IsRequired();
            entity.HasOne(suggestion => suggestion.RequestedBy)
                .WithMany()
                .HasForeignKey(suggestion => suggestion.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(suggestion => suggestion.Status);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(budget => budget.CategoryId);
            entity.Property(budget => budget.CategoryId).HasMaxLength(64);
            entity.Property(budget => budget.Limit).HasPrecision(18, 2);
            entity.HasOne(budget => budget.Category)
                .WithOne(category => category.Budget)
                .HasForeignKey<Budget>(budget => budget.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasData(
                new Budget { CategoryId = "food", Limit = 70000 },
                new Budget { CategoryId = "transport", Limit = 30000 },
                new Budget { CategoryId = "leisure", Limit = 25000 },
                new Budget { CategoryId = "health", Limit = 20000 });
        });
    }
}