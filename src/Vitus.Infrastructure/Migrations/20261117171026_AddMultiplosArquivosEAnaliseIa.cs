using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiplosArquivosEAnaliseIa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "analise_ia_json",
                table: "exames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "data_analise_ia",
                table: "exames",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "exame_arquivo",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    exame_id = table.Column<Guid>(type: "uuid", nullable: false),
                    caminho_arquivo = table.Column<string>(type: "text", nullable: false),
                    nome_arquivo_original = table.Column<string>(type: "text", nullable: false),
                    data_upload = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exame_arquivo", x => x.id);
                    table.ForeignKey(
                        name: "fk_exame_arquivo_exames_exame_id",
                        column: x => x.exame_id,
                        principalTable: "exames",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_exame_arquivo_exame_id",
                table: "exame_arquivo",
                column: "exame_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exame_arquivo");

            migrationBuilder.DropColumn(
                name: "analise_ia_json",
                table: "exames");

            migrationBuilder.DropColumn(
                name: "data_analise_ia",
                table: "exames");
        }
    }
}
