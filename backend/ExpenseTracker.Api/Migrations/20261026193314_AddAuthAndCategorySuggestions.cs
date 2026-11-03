using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndCategorySuggestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategorySource",
                table: "Transactions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SuggestionId",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CategorySuggestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SuggestedCategoryId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ProposedCategoryName = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    Reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ResolvedCategoryId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DecidedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    DecidedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategorySuggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategorySuggestions_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategorySuggestions_RequestedByUserId",
                table: "CategorySuggestions",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CategorySuggestions_Status",
                table: "CategorySuggestions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategorySuggestions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropColumn(
                name: "CategorySource",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "SuggestionId",
                table: "Transactions");
        }
    }
}
