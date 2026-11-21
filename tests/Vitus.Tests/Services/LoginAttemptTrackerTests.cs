using FluentAssertions;
using Vitus.Infrastructure.Services;

namespace Vitus.Tests.Services
{
    public class LoginAttemptTrackerTests
    {
        private readonly LoginAttemptTracker _tracker = new();

        [Fact]
        public void SemFalhas_NaoBloqueia()
        {
            _tracker.TempoRestanteBloqueio("maria@vitus.com").Should().BeNull();
        }

        [Fact]
        public void QuatroFalhas_NaoBloqueiam()
        {
            for (var i = 0; i < 4; i++)
                _tracker.RegistrarFalha("maria@vitus.com");

            _tracker.TempoRestanteBloqueio("maria@vitus.com").Should().BeNull();
        }

        [Fact]
        public void CincoFalhas_BloqueiamPorQuinzeMinutos()
        {
            for (var i = 0; i < 5; i++)
                _tracker.RegistrarFalha("maria@vitus.com");

            var restante = _tracker.TempoRestanteBloqueio("maria@vitus.com");

            restante.Should().NotBeNull();
            restante!.Value.Should().BeGreaterThan(TimeSpan.FromMinutes(14));
            restante.Value.Should().BeLessThanOrEqualTo(TimeSpan.FromMinutes(15));
        }

        [Fact]
        public void Limpar_RemoveOBloqueio()
        {
            for (var i = 0; i < 5; i++)
                _tracker.RegistrarFalha("maria@vitus.com");

            _tracker.Limpar("maria@vitus.com");

            _tracker.TempoRestanteBloqueio("maria@vitus.com").Should().BeNull();
        }

        [Fact]
        public void Chave_IgnoraMaiusculasEEspacos()
        {
            for (var i = 0; i < 5; i++)
                _tracker.RegistrarFalha("  MARIA@Vitus.COM ");

            _tracker.TempoRestanteBloqueio("maria@vitus.com").Should().NotBeNull();
        }

        [Fact]
        public void BloqueioDeUmUsuario_NaoAfetaOutro()
        {
            for (var i = 0; i < 5; i++)
                _tracker.RegistrarFalha("maria@vitus.com");

            _tracker.TempoRestanteBloqueio("joao@vitus.com").Should().BeNull();
        }
    }
}