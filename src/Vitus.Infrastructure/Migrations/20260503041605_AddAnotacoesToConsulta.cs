using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnotacoesToConsulta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Anotacoes",
                table: "consultas",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Anotacoes",
                table: "consultas");
        }
    }
}
