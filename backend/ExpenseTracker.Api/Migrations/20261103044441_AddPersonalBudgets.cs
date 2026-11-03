using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalBudgets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserBudgets",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Limit = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBudgets", x => new { x.UserId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_UserBudgets_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserBudgets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_CreatedByUserId",
                table: "Transactions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBudgets_CategoryId",
                table: "UserBudgets",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Users_CreatedByUserId",
                table: "Transactions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Users_CreatedByUserId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "UserBudgets");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_CreatedByUserId",
                table: "Transactions");
        }
    }
}
