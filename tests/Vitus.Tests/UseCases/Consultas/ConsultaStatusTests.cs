using FluentAssertions;
using Vitus.Domain.Exceptions;
using Vitus.Tests.Helpers;

namespace Vitus.Tests.UseCases.Consultas
{
    public class ConsultaStatusTests
    {
        [Fact]
        public void IniciarTriagem_Success()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            consulta.IniciarTriagem();

            consulta.Status.ToString().Should().Be("EmTriagem");
        }

        [Fact]
        public void IniciarTriagem_Fail_StatusInvalido()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();

            var act = () => consulta.IniciarTriagem();

            act.Should().Throw<DomainException>()
                .WithMessage("Consulta não está apta para triagem");
        }

        [Fact]
        public void AguardarAtendimento_Success()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();

            consulta.AguardarAtendimento();

            consulta.Status.ToString().Should().Be("AguardandoAtendimento");
        }

        [Fact]
        public void AguardarAtendimento_Fail_StatusInvalido()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            var act = () => consulta.AguardarAtendimento();

            act.Should().Throw<DomainException>()
                .WithMessage("Consulta não saiu da triagem");
        }

        [Fact]
        public void IniciarAtendimento_Success()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();
            consulta.AguardarAtendimento();

            consulta.IniciarAtendimento();

            consulta.Status.ToString().Should().Be("EmAtendimento");
        }

        [Fact]
        public void IniciarAtendimento_Fail_StatusInvalido()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            var act = () => consulta.IniciarAtendimento();

            act.Should().Throw<DomainException>()
                .WithMessage("Consulta não está pronta para atendimento");
        }

        [Fact]
        public void Finalizar_Success()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();
            consulta.AguardarAtendimento();
            consulta.IniciarAtendimento();

            consulta.Finalizar();

            consulta.Status.ToString().Should().Be("Finalizada");
        }

        [Fact]
        public void Finalizar_Fail_StatusInvalido()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            var act = () => consulta.Finalizar();

            act.Should().Throw<DomainException>()
                .WithMessage("Consulta não pode ser finalizada");
        }

        [Fact]
        public void Cancelar_Success_DeAgendada()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            consulta.Cancelar();

            consulta.Status.ToString().Should().Be("Cancelada");
        }

        [Fact]
        public void Cancelar_Fail_ConsultaFinalizada()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();
            consulta.AguardarAtendimento();
            consulta.IniciarAtendimento();
            consulta.Finalizar();

            var act = () => consulta.Cancelar();

            act.Should().Throw<DomainException>()
                .WithMessage("Consulta já finalizada não pode ser cancelada");
        }

        [Fact]
        public void Anotar_Success()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();
            consulta.AguardarAtendimento();
            consulta.IniciarAtendimento();

            consulta.Anotar("Paciente com dor lombar.");

            consulta.Anotacoes.Should().Be("Paciente com dor lombar.");
        }

        [Fact]
        public void Anotar_Fail_StatusInvalido()
        {
            var consulta = EntidadeFactory.CriarConsulta();

            var act = () => consulta.Anotar("Anotação");

            act.Should().Throw<DomainException>()
                .WithMessage("Anotações só podem ser feitas durante o atendimento");
        }

        [Fact]
        public void Anotar_Fail_AnotacaoVazia()
        {
            var consulta = EntidadeFactory.CriarConsulta();
            consulta.IniciarTriagem();
            consulta.AguardarAtendimento();
            consulta.IniciarAtendimento();

            var act = () => consulta.Anotar("");

            act.Should().Throw<DomainException>()
                .WithMessage("Anotação não pode ser vazia");
        }
    }
}