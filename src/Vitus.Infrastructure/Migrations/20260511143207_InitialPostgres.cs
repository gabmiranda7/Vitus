using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "medicos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    especialidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    crm = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medicos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pacientes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pacientes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    senha_hash = table.Column<string>(type: "text", nullable: false),
                    perfil = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "prontuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    paciente_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prontuarios", x => x.id);
                    table.ForeignKey(
                        name: "fk_prontuarios_pacientes_paciente_id",
                        column: x => x.paciente_id,
                        principalTable: "pacientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consultas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    paciente_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medico_id = table.Column<Guid>(type: "uuid", nullable: false),
                    prontuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data_consulta = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    anotacoes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consultas", x => x.id);
                    table.ForeignKey(
                        name: "fk_consultas_medicos_medico_id",
                        column: x => x.medico_id,
                        principalTable: "medicos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consultas_pacientes_paciente_id",
                        column: x => x.paciente_id,
                        principalTable: "pacientes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_consultas_prontuarios_prontuario_id",
                        column: x => x.prontuario_id,
                        principalTable: "prontuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "triagens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    prontuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    observacoes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    pressao_arterial = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    temperatura = table.Column<decimal>(type: "numeric", nullable: false),
                    nome_enfermeiro = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_triagens", x => x.id);
                    table.ForeignKey(
                        name: "fk_triagens_prontuarios_prontuario_id",
                        column: x => x.prontuario_id,
                        principalTable: "prontuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "receitas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    consulta_id = table.Column<Guid>(type: "uuid", nullable: false),
                    prontuario_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_receitas", x => x.id);
                    table.ForeignKey(
                        name: "fk_receitas_consultas_consulta_id",
                        column: x => x.consulta_id,
                        principalTable: "consultas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_receitas_prontuarios_prontuario_id",
                        column: x => x.prontuario_id,
                        principalTable: "prontuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "medicamentos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dosagem = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    posologia = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    receita_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medicamentos", x => x.id);
                    table.ForeignKey(
                        name: "fk_medicamentos_receitas_receita_id",
                        column: x => x.receita_id,
                        principalTable: "receitas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_consultas_medico_id",
                table: "consultas",
                column: "medico_id");

            migrationBuilder.CreateIndex(
                name: "ix_consultas_paciente_id",
                table: "consultas",
                column: "paciente_id");

            migrationBuilder.CreateIndex(
                name: "ix_consultas_prontuario_id",
                table: "consultas",
                column: "prontuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_medicamentos_receita_id",
                table: "medicamentos",
                column: "receita_id");

            migrationBuilder.CreateIndex(
                name: "ix_medicos_crm",
                table: "medicos",
                column: "crm",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_prontuarios_paciente_id",
                table: "prontuarios",
                column: "paciente_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_receitas_consulta_id",
                table: "receitas",
                column: "consulta_id");

            migrationBuilder.CreateIndex(
                name: "ix_receitas_prontuario_id",
                table: "receitas",
                column: "prontuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_triagens_prontuario_id",
                table: "triagens",
                column: "prontuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_email",
                table: "usuarios",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "medicamentos");

            migrationBuilder.DropTable(
                name: "triagens");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "receitas");

            migrationBuilder.DropTable(
                name: "consultas");

            migrationBuilder.DropTable(
                name: "medicos");

            migrationBuilder.DropTable(
                name: "prontuarios");

            migrationBuilder.DropTable(
                name: "pacientes");
        }
    }
}
