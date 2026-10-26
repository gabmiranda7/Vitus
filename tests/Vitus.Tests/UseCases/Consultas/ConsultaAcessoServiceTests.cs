using FluentAssertions;
using Moq;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Services;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class ConsultaAcessoServiceTests
    {
        private readonly Mock<IUsuarioContexto> _contexto = new();
        private readonly Mock<IMedicoRepository> _medicoRepo = new();
        private readonly ConsultaAcessoService _service;

        public ConsultaAcessoServiceTests()
        {
            _service = new ConsultaAcessoService(_contexto.Object, _medicoRepo.Object);
        }

        private (Medico medico, Consulta consulta) CenarioMedicoLogado()
        {
            var usuarioId = Guid.NewGuid();
            var medico = EntidadeFactory.CriarMedico(usuarioId: usuarioId);
            var consulta = EntidadeFactory.CriarConsulta(medicoId: medico.Id);

            _contexto.Setup(c => c.Perfil).Returns("Medico");
            _contexto.Setup(c => c.UsuarioId).Returns(usuarioId);
            _medicoRepo.Setup(r => r.GetByUsuarioId(usuarioId)).ReturnsAsync(medico);

            return (medico, consulta);
        }

        [Fact]
        public async Task GarantirMedicoResponsavel_MedicoDaConsulta_Passa()
        {
            var (_, consulta) = CenarioMedicoLogado();

            var act = async () => await _service.GarantirMedicoResponsavel(consulta);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GarantirMedicoResponsavel_ConsultaDeOutroMedico_NegaAcesso()
        {
            CenarioMedicoLogado();
            var consultaDeOutro = EntidadeFactory.CriarConsulta(medicoId: Guid.NewGuid());

            var act = async () => await _service.GarantirMedicoResponsavel(consultaDeOutro);

            await act.Should().ThrowAsync<AcessoNegadoException>();
        }

        [Fact]
        public async Task GarantirMedicoResponsavel_UsuarioSemRegistroDeMedico_NegaAcesso()
        {
            var usuarioId = Guid.NewGuid();
            _contexto.Setup(c => c.Perfil).Returns("Medico");
            _contexto.Setup(c => c.UsuarioId).Returns(usuarioId);
            _medicoRepo.Setup(r => r.GetByUsuarioId(usuarioId)).ReturnsAsync((Medico?)null);

            var act = async () => await _service.GarantirMedicoResponsavel(EntidadeFactory.CriarConsulta());

            await act.Should().ThrowAsync<AcessoNegadoException>();
        }

        [Fact]
        public async Task GarantirMedicoResponsavel_PerfilQueNaoEMedico_NegaAcesso()
        {
            _contexto.Setup(c => c.Perfil).Returns("Recepcionista");

            var act = async () => await _service.GarantirMedicoResponsavel(EntidadeFactory.CriarConsulta());

            await act.Should().ThrowAsync<AcessoNegadoException>();
        }

        [Fact]
        public async Task GarantirResponsavelSeMedico_Recepcionista_PassaSemConsultarMedico()
        {
            _contexto.Setup(c => c.Perfil).Returns("Recepcionista");

            var act = async () => await _service.GarantirResponsavelSeMedico(EntidadeFactory.CriarConsulta());

            await act.Should().NotThrowAsync();
            _medicoRepo.Verify(r => r.GetByUsuarioId(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task GarantirResponsavelSeMedico_MedicoDaConsulta_Passa()
        {
            var (_, consulta) = CenarioMedicoLogado();

            var act = async () => await _service.GarantirResponsavelSeMedico(consulta);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GarantirResponsavelSeMedico_ConsultaDeOutroMedico_NegaAcesso()
        {
            CenarioMedicoLogado();
            var consultaDeOutro = EntidadeFactory.CriarConsulta(medicoId: Guid.NewGuid());

            var act = async () => await _service.GarantirResponsavelSeMedico(consultaDeOutro);

            await act.Should().ThrowAsync<AcessoNegadoException>();
        }
    }
}