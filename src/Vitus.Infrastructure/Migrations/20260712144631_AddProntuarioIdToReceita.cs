using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProntuarioIdToReceita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_receitas_prontuarios_prontuario_id",
                table: "receitas");

            migrationBuilder.AlterColumn<Guid>(
                name: "prontuario_id",
                table: "receitas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "quantidade",
                table: "medicamentos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddForeignKey(
                name: "fk_receitas_prontuarios_prontuario_id",
                table: "receitas",
                column: "prontuario_id",
                principalTable: "prontuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_receitas_prontuarios_prontuario_id",
                table: "receitas");

            migrationBuilder.AlterColumn<Guid>(
                name: "prontuario_id",
                table: "receitas",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "quantidade",
                table: "medicamentos",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddForeignKey(
                name: "fk_receitas_prontuarios_prontuario_id",
                table: "receitas",
                column: "prontuario_id",
                principalTable: "prontuarios",
                principalColumn: "id");
        }
    }
}
