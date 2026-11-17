using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixExameArquivoIdGeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_exame_arquivo_exames_exame_id",
                table: "exame_arquivo");

            migrationBuilder.DropPrimaryKey(
                name: "pk_exame_arquivo",
                table: "exame_arquivo");

            migrationBuilder.RenameTable(
                name: "exame_arquivo",
                newName: "exame_arquivos");

            migrationBuilder.RenameIndex(
                name: "ix_exame_arquivo_exame_id",
                table: "exame_arquivos",
                newName: "ix_exame_arquivos_exame_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_exame_arquivos",
                table: "exame_arquivos",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_exame_arquivos_exames_exame_id",
                table: "exame_arquivos",
                column: "exame_id",
                principalTable: "exames",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_exame_arquivos_exames_exame_id",
                table: "exame_arquivos");

            migrationBuilder.DropPrimaryKey(
                name: "pk_exame_arquivos",
                table: "exame_arquivos");

            migrationBuilder.RenameTable(
                name: "exame_arquivos",
                newName: "exame_arquivo");

            migrationBuilder.RenameIndex(
                name: "ix_exame_arquivos_exame_id",
                table: "exame_arquivo",
                newName: "ix_exame_arquivo_exame_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_exame_arquivo",
                table: "exame_arquivo",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_exame_arquivo_exames_exame_id",
                table: "exame_arquivo",
                column: "exame_id",
                principalTable: "exames",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
