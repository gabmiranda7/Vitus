using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNomeEnfermeiroToTriagem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NomeEnfermeiro",
                table: "triagens",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NomeEnfermeiro",
                table: "triagens");
        }
    }
}
