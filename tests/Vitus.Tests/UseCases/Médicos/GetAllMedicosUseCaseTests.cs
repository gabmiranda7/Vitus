using Moq;
using FluentAssertions;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Medicos
{
    public class GetAllMedicosUseCaseTests
    {
        private readonly Mock<IMedicoRepository> _repositoryMock;
        private readonly Mock<IUsuarioRepository> _usuarioRepositoryMock;
        private readonly GetAllMedicosUseCase _useCase;

        public GetAllMedicosUseCaseTests()
        {
            _repositoryMock = new Mock<IMedicoRepository>();
            _usuarioRepositoryMock = new Mock<IUsuarioRepository>();
            _useCase = new GetAllMedicosUseCase(_repositoryMock.Object, _usuarioRepositoryMock.Object);
        }

        private static Usuario UsuarioMedico(string email, bool aprovado)
        {
            var usuario = new Usuario("Médico", email, "hash", PerfilUsuario.Medico);
            if (aprovado)
                usuario.Aprovar();
            return usuario;
        }

        [Fact]
        public async Task Execute_Success()
        {
            var u1 = UsuarioMedico("carlos@vitus.com", aprovado: true);
            var u2 = UsuarioMedico("ana@vitus.com", aprovado: true);
            var medicos = new List<Medico>
            {
                EntidadeFactory.CriarMedico("Dr. Carlos", "Cardiologia", "CRM-MG 12345", u1.Id),
                EntidadeFactory.CriarMedico("Dra. Ana", "Pediatria", "CRM-SP 67890", u2.Id)
            };

            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(medicos);
            _usuarioRepositoryMock.Setup(r => r.GetByStatus(StatusUsuario.Aprovado))
                .ReturnsAsync(new List<Usuario> { u1, u2 });

            var resultado = await _useCase.Execute();

            resultado.Should().HaveCount(2);
            resultado[0].Nome.Should().Be("Dr. Carlos");
            resultado[1].Nome.Should().Be("Dra. Ana");
        }

        [Fact]
        public async Task Execute_Success_IgnoraMedicosSemContaAprovada()
        {
            var aprovado = UsuarioMedico("carlos@vitus.com", aprovado: true);
            var pendente = UsuarioMedico("ana@vitus.com", aprovado: false);
            var medicos = new List<Medico>
            {
                EntidadeFactory.CriarMedico("Dr. Carlos", "Cardiologia", "CRM-MG 12345", aprovado.Id),
                EntidadeFactory.CriarMedico("Dra. Ana", "Pediatria", "CRM-SP 67890", pendente.Id)
            };

            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(medicos);
            _usuarioRepositoryMock.Setup(r => r.GetByStatus(StatusUsuario.Aprovado))
                .ReturnsAsync(new List<Usuario> { aprovado });

            var resultado = await _useCase.Execute();

            resultado.Should().ContainSingle();
            resultado[0].Nome.Should().Be("Dr. Carlos");
        }

        [Fact]
        public async Task Execute_Success_EmptyList()
        {
            _repositoryMock.Setup(r => r.GetAll()).ReturnsAsync(new List<Medico>());
            _usuarioRepositoryMock.Setup(r => r.GetByStatus(StatusUsuario.Aprovado))
                .ReturnsAsync(new List<Usuario>());

            var resultado = await _useCase.Execute();

            resultado.Should().BeEmpty();
        }
    }
}