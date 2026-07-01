using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exames",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    prontuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    consulta_id = table.Column<Guid>(type: "uuid", nullable: true),
                    categoria = table.Column<string>(type: "text", nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    medico_solicitante = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    data_exame = table.Column<DateOnly>(type: "date", nullable: false),
                    observacoes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    caminho_arquivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    nome_arquivo_original = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exames", x => x.id);
                    table.ForeignKey(
                        name: "fk_exames_prontuarios_prontuario_id",
                        column: x => x.prontuario_id,
                        principalTable: "prontuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_exames_prontuario_id",
                table: "exames",
                column: "prontuario_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exames");
        }
    }
}
