using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioIdToMedico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "usuario_id",
                table: "medicos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "ix_medicos_usuario_id",
                table: "medicos",
                column: "usuario_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_medicos_usuarios_usuario_id",
                table: "medicos",
                column: "usuario_id",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_medicos_usuarios_usuario_id",
                table: "medicos");

            migrationBuilder.DropIndex(
                name: "ix_medicos_usuario_id",
                table: "medicos");

            migrationBuilder.DropColumn(
                name: "usuario_id",
                table: "medicos");
        }
    }
}
