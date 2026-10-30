using FluentAssertions;
using Vitus.Application.UseCases.Receitas.Acompanhamento;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.ValueObjects;

namespace Vitus.Tests.UseCases.Receitas
{
    public class AcompanhamentoReceitasTests
    {
        private static readonly DateOnly Hoje = new(2026, 11, 1);

        private static DateTime Dia(int mes, int dia) => new(2026, mes, dia, 12, 0, 0, DateTimeKind.Utc);

        private static Receita NovaReceita(DateTime emissao, params (string Nome, bool Acompanhar, int? Dias)[] meds)
        {
            var receita = new Receita(Guid.NewGuid(), Guid.NewGuid(), emissao);
            foreach (var m in meds)
                receita.AdicionarMedicamento(m.Nome, "10mg", "1 cp ao dia", "30 cps", m.Acompanhar, m.Dias);
            return receita;
        }

        [Fact]
        public void Calcula_vencimento_e_dias_restantes()
        {
            var receita = NovaReceita(Dia(10, 20), ("Losartana", true, 30));

            var resultado = AcompanhamentoReceitas.Calcular(new[] { receita }, Hoje);

            resultado.Should().ContainSingle();
            resultado[0].DataVencimento.Should().Be(new DateOnly(2026, 11, 19));
            resultado[0].DiasRestantes.Should().Be(18);
        }

        [Fact]
        public void Receita_vencida_tem_dias_negativos()
        {
            var receita = NovaReceita(Dia(8, 1), ("Losartana", true, 30));

            var resultado = AcompanhamentoReceitas.Calcular(new[] { receita }, Hoje);

            resultado[0].DiasRestantes.Should().Be(-62);
        }

        [Fact]
        public void Medicamento_sem_acompanhamento_nao_entra()
        {
            var receita = NovaReceita(Dia(10, 20), ("Amoxicilina", false, null));

            AcompanhamentoReceitas.Calcular(new[] { receita }, Hoje).Should().BeEmpty();
        }

        [Fact]
        public void Renovacao_substitui_a_receita_antiga()
        {
            var antiga = NovaReceita(Dia(8, 1), ("Losartana", true, 30));
            var nova = NovaReceita(Dia(10, 22), ("LOSARTANA ", true, 30));

            var resultado = AcompanhamentoReceitas.Calcular(new[] { antiga, nova }, Hoje);

            resultado.Should().ContainSingle();
            resultado[0].ReceitaId.Should().Be(nova.Id);
            resultado[0].DiasRestantes.Should().Be(20);
        }

        [Fact]
        public void Nome_e_normalizado_sem_acento_caixa_e_espacos_extras()
        {
            var antiga = NovaReceita(Dia(10, 10), ("Ácido Fólico", true, 30));
            var nova = NovaReceita(Dia(10, 20), ("acido   folico", true, 30));

            var resultado = AcompanhamentoReceitas.Calcular(new[] { antiga, nova }, Hoje);

            resultado.Should().ContainSingle();
            resultado[0].ReceitaId.Should().Be(nova.Id);
        }

        [Fact]
        public void Ultima_prescricao_sem_acompanhamento_encerra_o_alerta()
        {
            var antiga = NovaReceita(Dia(10, 1), ("Losartana", true, 30));
            var nova = NovaReceita(Dia(10, 25), ("Losartana", false, null));

            AcompanhamentoReceitas.Calcular(new[] { antiga, nova }, Hoje).Should().BeEmpty();
        }

        [Fact]
        public void Lista_vem_ordenada_pelo_vencimento_mais_proximo()
        {
            var a = NovaReceita(Dia(10, 20), ("Remedio A", true, 30));
            var b = NovaReceita(Dia(10, 25), ("Remedio B", true, 30));
            var c = NovaReceita(Dia(8, 1), ("Remedio C", true, 30));

            var resultado = AcompanhamentoReceitas.Calcular(new[] { a, b, c }, Hoje);

            resultado.Select(t => t.Medicamento).Should().ContainInOrder("Remedio C", "Remedio A", "Remedio B");
        }

        [Fact]
        public void Acompanhar_sem_validade_e_rejeitado()
        {
            var act = () => new Medicamento("Losartana", "50mg", "1 cp", "30", true, null);

            act.Should().Throw<DomainException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        [InlineData(731)]
        public void Validade_fora_do_limite_e_rejeitada(int dias)
        {
            var act = () => new Medicamento("Losartana", "50mg", "1 cp", "30", true, dias);

            act.Should().Throw<DomainException>();
        }

        [Fact]
        public void Validade_maxima_e_aceita()
        {
            new Medicamento("Losartana", "50mg", "1 cp", "30", true, 730).ValidadeDias.Should().Be(730);
        }

        [Fact]
        public void Validade_e_ignorada_quando_nao_acompanha()
        {
            new Medicamento("Amoxicilina", "500mg", "1 cp", "21", false, 30).ValidadeDias.Should().BeNull();
        }
    }
}