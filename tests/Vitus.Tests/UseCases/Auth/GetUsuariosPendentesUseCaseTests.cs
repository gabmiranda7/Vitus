using FluentAssertions;
using Moq;
using Vitus.Application.UseCases.Auth.GetUsuariosPendentes;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Auth
{
    public class GetUsuariosPendentesUseCaseTests
    {
        private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
        private readonly Mock<IMedicoRepository> _medicoRepoMock = new();
        private readonly Mock<IEnfermeiroRepository> _enfermeiroRepoMock = new();
        private readonly GetUsuariosPendentesUseCase _useCase;

        public GetUsuariosPendentesUseCaseTests()
        {
            _useCase = new GetUsuariosPendentesUseCase(
                _usuarioRepoMock.Object, _medicoRepoMock.Object, _enfermeiroRepoMock.Object);
        }

        [Fact]
        public async Task Execute_TrazCrmDoMedicoECorenDoEnfermeiro()
        {
            var uMedico = new Usuario("Dr. Carlos", "carlos@vitus.com", "hash", PerfilUsuario.Medico);
            var uEnfermeiro = new Usuario("Ana", "ana@vitus.com", "hash", PerfilUsuario.Enfermeiro);
            var uRecepcao = new Usuario("Maria", "maria@vitus.com", "hash", PerfilUsuario.Recepcionista);

            _usuarioRepoMock.Setup(r => r.GetByStatus(StatusUsuario.Pendente))
                .ReturnsAsync(new List<Usuario> { uMedico, uEnfermeiro, uRecepcao });
            _medicoRepoMock.Setup(r => r.GetByUsuarioId(uMedico.Id))
                .ReturnsAsync(EntidadeFactory.CriarMedico("Dr. Carlos", "Cardiologia", "CRM-MG 12345", uMedico.Id));
            _enfermeiroRepoMock.Setup(r => r.GetByUsuarioId(uEnfermeiro.Id))
                .ReturnsAsync(new Enfermeiro("Ana", "COREN-MG 123456", "UTI", uEnfermeiro.Id));

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(3);

            var medico = resultado.Single(r => r.Perfil == "Medico");
            medico.Crm.Should().Be("CRM-MG 12345");
            medico.Especialidade.Should().Be("Cardiologia");

            var enfermeiro = resultado.Single(r => r.Perfil == "Enfermeiro");
            enfermeiro.Coren.Should().Be("COREN-MG 123456");
            enfermeiro.Especializacao.Should().Be("UTI");

            var recepcionista = resultado.Single(r => r.Perfil == "Recepcionista");
            recepcionista.Crm.Should().BeNull();
            recepcionista.Coren.Should().BeNull();
        }

        [Fact]
        public async Task Execute_EnfermeiroAntigoSemVinculo_VemSemCoren()
        {
            var uEnfermeiro = new Usuario("Ana", "ana@vitus.com", "hash", PerfilUsuario.Enfermeiro);

            _usuarioRepoMock.Setup(r => r.GetByStatus(StatusUsuario.Pendente))
                .ReturnsAsync(new List<Usuario> { uEnfermeiro });
            _enfermeiroRepoMock.Setup(r => r.GetByUsuarioId(uEnfermeiro.Id))
                .ReturnsAsync((Enfermeiro?)null);

            var resultado = await _useCase.Execute();

            resultado.Should().ContainSingle();
            resultado[0].Coren.Should().BeNull();
        }
    }
}