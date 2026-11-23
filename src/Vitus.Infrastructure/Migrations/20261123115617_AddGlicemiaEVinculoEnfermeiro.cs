using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGlicemiaEVinculoEnfermeiro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "glicemia",
                table: "triagens",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "usuario_id",
                table: "enfermeiro",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_triagens_consulta_id",
                table: "triagens",
                column: "consulta_id",
                unique: true,
                filter: "consulta_id <> '00000000-0000-0000-0000-000000000000'");

            migrationBuilder.CreateIndex(
                name: "ix_enfermeiro_usuario_id",
                table: "enfermeiro",
                column: "usuario_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_enfermeiro_usuarios_usuario_id",
                table: "enfermeiro",
                column: "usuario_id",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_enfermeiro_usuarios_usuario_id",
                table: "enfermeiro");

            migrationBuilder.DropIndex(
                name: "ix_triagens_consulta_id",
                table: "triagens");

            migrationBuilder.DropIndex(
                name: "ix_enfermeiro_usuario_id",
                table: "enfermeiro");

            migrationBuilder.DropColumn(
                name: "glicemia",
                table: "triagens");

            migrationBuilder.DropColumn(
                name: "usuario_id",
                table: "enfermeiro");
        }
    }
}
