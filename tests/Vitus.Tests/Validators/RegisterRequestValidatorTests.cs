using FluentAssertions;
using Vitus.Application.Validators.Auth;
using Vitus.Communication.Auth.Requests;

namespace Vitus.Tests.Validators
{
    public class RegisterRequestValidatorTests
    {
        private readonly RegisterRequestValidator _validator = new();

        private static RegisterRequestJson Request(string senha) => new()
        {
            Nome = "Maria Silva",
            Email = "maria@vitus.com",
            Senha = senha,
            Perfil = "Recepcionista"
        };

        [Theory]
        [InlineData("Senha@123")]
        [InlineData("Vitus#2026")]
        [InlineData("aB3$aB3$")]
        public void Senha_Forte_E_Valida(string senha)
        {
            _validator.Validate(Request(senha)).IsValid.Should().BeTrue();
        }

        [Theory]
        [InlineData("")]
        [InlineData("Ab1$")]          // curta demais
        [InlineData("senha@123")]     // sem maiúscula
        [InlineData("SENHA@123")]     // sem minúscula
        [InlineData("Senha@abc")]     // sem número
        [InlineData("Senha1234")]     // sem símbolo
        public void Senha_Fraca_E_Invalida(string senha)
        {
            _validator.Validate(Request(senha)).IsValid.Should().BeFalse();
        }

        [Fact]
        public void Senha_Acima_Do_Limite_E_Invalida()
        {
            var senha = "Aa1$" + new string('x', SenhaForteExtensions.TamanhoMaximo);
            _validator.Validate(Request(senha)).IsValid.Should().BeFalse();
        }
    }
}
