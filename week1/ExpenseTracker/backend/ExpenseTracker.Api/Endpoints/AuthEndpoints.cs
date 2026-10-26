using System.Security.Claims;
using System.Text;
using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace ExpenseTracker.Api.Endpoints;

public sealed record RegisterRequest(string? Email, string? DisplayName, string? Password);
public sealed record LoginRequest(string? Email, string? Password);
public sealed record UserDto(Guid Id, string Email, string DisplayName, string Role);
public sealed record AuthResponse(string Token, UserDto User);

public static class PrincipalExtensions
{
    public static Guid? UserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst("sub")?.Value, out var id) ? id : null;
}

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapGet("/status", async (FinanceDbContext db, CancellationToken ct) =>
            Results.Ok(new { bootstrapRequired = !await db.Users.AnyAsync(ct) })).AllowAnonymous();

        auth.MapPost("/bootstrap", async (
            RegisterRequest request,
            FinanceDbContext db,
            IPasswordHasher<AppUser> hasher,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (await db.Users.AnyAsync(ct))
            {
                return Results.Conflict(new { error = "Az első felhasználó már létezik." });
            }

            var (user, error) = BuildUser(request, UserRole.FamilyAdmin, hasher);
            if (user is null) return Validation(error!);

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
            return Results.Ok(Issue(user, config));
        }).AllowAnonymous().RequireRateLimiting("auth");

        auth.MapPost("/login", async (
            LoginRequest request,
            FinanceDbContext db,
            IPasswordHasher<AppUser> hasher,
            IConfiguration config,
            CancellationToken ct) =>
        {
            var email = request.Email?.Trim().ToLowerInvariant();
            var user = string.IsNullOrEmpty(email)
                ? null
                : await db.Users.FirstOrDefaultAsync(candidate => candidate.Email == email, ct);

            if (user is null || request.Password is null
                || hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            {
                return Results.Json(new { error = "Hibás e-mail vagy jelszó." }, statusCode: StatusCodes.Status401Unauthorized);
            }

            return Results.Ok(Issue(user, config));
        }).AllowAnonymous().RequireRateLimiting("auth");

        auth.MapGet("/me", async (ClaimsPrincipal principal, FinanceDbContext db, CancellationToken ct) =>
        {
            var id = principal.UserId();
            var user = id is null ? null : await db.Users.AsNoTracking().FirstOrDefaultAsync(candidate => candidate.Id == id, ct);
            return user is null ? Results.Unauthorized() : Results.Ok(ToDto(user));
        });

        app.MapPost("/api/users", async (
            RegisterRequest request,
            FinanceDbContext db,
            IPasswordHasher<AppUser> hasher,
            CancellationToken ct) =>
        {
            var (user, error) = BuildUser(request, UserRole.Member, hasher);
            if (user is null) return Validation(error!);

            if (await db.Users.AnyAsync(candidate => candidate.Email == user.Email, ct))
            {
                return Results.Conflict(new { error = "Ez az e-mail cím már foglalt." });
            }

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/users/{user.Id}", ToDto(user));
        }).RequireAuthorization("FamilyAdmin");
    }

    private static IResult Validation(string error) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { ["user"] = [error] });

    private static UserDto ToDto(AppUser user) => new(user.Id, user.Email, user.DisplayName, user.Role.ToString());

    private static (AppUser? User, string? Error) BuildUser(RegisterRequest request, UserRole role, IPasswordHasher<AppUser> hasher)
    {
        var email = request.Email?.Trim().ToLowerInvariant();
        var name = request.DisplayName?.Trim();
        if (string.IsNullOrEmpty(email) || email.Length > 254 || !email.Contains('@')) return (null, "Érvényes e-mail cím szükséges.");
        if (string.IsNullOrEmpty(name) || name.Length > 60) return (null, "A név legfeljebb 60 karakter lehet.");
        if (request.Password is null || request.Password.Length < 8 || request.Password.Length > 128)
        {
            return (null, "A jelszó legalább 8 karakter legyen.");
        }

        var user = new AppUser { Id = Guid.NewGuid(), Email = email, DisplayName = name, Role = role };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        return (user, null);
    }

    private static AuthResponse Issue(AppUser user, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:SigningKey"]!));
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = "fintrack",
            Audience = "fintrack",
            Expires = DateTime.UtcNow.AddHours(8),
            Claims = new Dictionary<string, object>
            {
                ["sub"] = user.Id.ToString(),
                ["email"] = user.Email,
                ["role"] = user.Role.ToString(),
            },
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
        };

        return new AuthResponse(new JsonWebTokenHandler().CreateToken(descriptor), ToDto(user));
    }
}
