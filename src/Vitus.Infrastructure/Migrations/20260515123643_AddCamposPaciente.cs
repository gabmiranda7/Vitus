using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposPaciente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "aceita_termos",
                table: "pacientes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "cartao_sus",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cpf",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "data_nascimento",
                table: "pacientes",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "endereco",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "estado_civil",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "informacoes_adicionais",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nome_mae",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nome_pai",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "profissao",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sexo",
                table: "pacientes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "aceita_termos",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "cartao_sus",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "cpf",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "data_nascimento",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "endereco",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "estado_civil",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "informacoes_adicionais",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "nome_mae",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "nome_pai",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "profissao",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "sexo",
                table: "pacientes");
        }
    }
}
