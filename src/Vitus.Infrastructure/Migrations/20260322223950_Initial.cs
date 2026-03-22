using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vitus.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "medicos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Especialidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medicos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pacientes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pacientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "prontuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prontuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_prontuarios_pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "consultas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProntuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataConsulta = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consultas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_consultas_medicos_MedicoId",
                        column: x => x.MedicoId,
                        principalTable: "medicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_consultas_pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_consultas_prontuarios_ProntuarioId",
                        column: x => x.ProntuarioId,
                        principalTable: "prontuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "triagens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProntuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PressaoArterial = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Temperatura = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_triagens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_triagens_prontuarios_ProntuarioId",
                        column: x => x.ProntuarioId,
                        principalTable: "prontuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "receitas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsultaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProntuarioId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receitas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_receitas_consultas_ConsultaId",
                        column: x => x.ConsultaId,
                        principalTable: "consultas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_receitas_prontuarios_ProntuarioId",
                        column: x => x.ProntuarioId,
                        principalTable: "prontuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "medicamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Dosagem = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Posologia = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ReceitaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medicamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_medicamentos_receitas_ReceitaId",
                        column: x => x.ReceitaId,
                        principalTable: "receitas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_consultas_MedicoId",
                table: "consultas",
                column: "MedicoId");

            migrationBuilder.CreateIndex(
                name: "IX_consultas_PacienteId",
                table: "consultas",
                column: "PacienteId");

            migrationBuilder.CreateIndex(
                name: "IX_consultas_ProntuarioId",
                table: "consultas",
                column: "ProntuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_medicamentos_ReceitaId",
                table: "medicamentos",
                column: "ReceitaId");

            migrationBuilder.CreateIndex(
                name: "IX_prontuarios_PacienteId",
                table: "prontuarios",
                column: "PacienteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_receitas_ConsultaId",
                table: "receitas",
                column: "ConsultaId");

            migrationBuilder.CreateIndex(
                name: "IX_receitas_ProntuarioId",
                table: "receitas",
                column: "ProntuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_triagens_ProntuarioId",
                table: "triagens",
                column: "ProntuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "medicamentos");

            migrationBuilder.DropTable(
                name: "triagens");

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
