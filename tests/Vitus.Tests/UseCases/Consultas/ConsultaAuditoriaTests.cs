using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Consultas.AnotarConsulta;
using Vitus.Application.UseCases.Consultas.FinalizarConsulta;
using Vitus.Application.UseCases.Consultas.IniciarAtendimento;
using Vitus.Communication.Consulta.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class ConsultaAuditoriaTests
    {
        private readonly Mock<IConsultaRepository> _consultaRepoMock = new();
        private readonly Mock<IPacienteRepository> _pacienteRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<IConsultaAcessoService> _acessoMock = new();
        private readonly Mock<IAuditoriaService> _auditoriaMock = new();

        private Consulta Cenario(Func<Guid, Guid, Consulta> criar)
        {
            var paciente = EntidadeFactory.CriarPaciente();
            var medico = EntidadeFactory.CriarMedico();
            var consulta = criar(paciente.Id, medico.Id);

            _consultaRepoMock.Setup(r => r.GetById(consulta.Id)).ReturnsAsync(consulta);
            _pacienteRepoMock.Setup(r => r.GetById(paciente.Id)).ReturnsAsync(paciente);
            _medicoRepoMock.Setup(r => r.GetById(medico.Id)).ReturnsAsync(medico);

            return consulta;
        }

        private void VerificarAuditoria(AcaoAuditoria acao, Guid consultaId) =>
            _auditoriaMock.Verify(a => a.Registrar(acao, "Consulta", consultaId, It.IsAny<string?>()), Times.Once);

        [Fact]
        public async Task Anotar_RegistraAuditoria()
        {
            var consulta = Cenario((p, m) => EntidadeFactory.CriarConsultaEmAtendimento(p, m));
            var useCase = new AnotarConsultaUseCase(
                _consultaRepoMock.Object, _pacienteRepoMock.Object, _medicoRepoMock.Object,
                _acessoMock.Object, _auditoriaMock.Object);

            await useCase.Execute(consulta.Id, new AnotarConsultaRequestJson { Anotacoes = "Dor lombar." });

            VerificarAuditoria(AcaoAuditoria.AnotacaoClinica, consulta.Id);
        }

        [Fact]
        public async Task IniciarAtendimento_RegistraAuditoria()
        {
            var consulta = Cenario((p, m) =>
            {
                var c = EntidadeFactory.CriarConsulta(p, m);
                c.IniciarTriagem();
                c.AguardarAtendimento();
                return c;
            });
            var useCase = new IniciarAtendimentoUseCase(
                _consultaRepoMock.Object, _pacienteRepoMock.Object, _medicoRepoMock.Object,
                _acessoMock.Object, _auditoriaMock.Object);

            await useCase.Execute(consulta.Id);

            VerificarAuditoria(AcaoAuditoria.InicioAtendimento, consulta.Id);
        }

        [Fact]
        public async Task Finalizar_RegistraAuditoria()
        {
            var consulta = Cenario((p, m) => EntidadeFactory.CriarConsultaEmAtendimento(p, m));
            var useCase = new FinalizarConsultaUseCase(
                _consultaRepoMock.Object, _pacienteRepoMock.Object, _medicoRepoMock.Object,
                _acessoMock.Object, _auditoriaMock.Object);

            var resultado = await useCase.Execute(consulta.Id);

            resultado.Status.Should().Be("Finalizada");
            VerificarAuditoria(AcaoAuditoria.FinalizacaoConsulta, consulta.Id);
        }
    }
}