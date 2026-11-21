using Vitus.Domain.Exceptions;

namespace Vitus.Domain.ValueObjects
{
    public static class CpfBrasileiro
    {
        public static string SomenteDigitos(string? valor) =>
            string.IsNullOrEmpty(valor) ? string.Empty : new string(valor.Where(char.IsDigit).ToArray());

        public static bool EhValido(string? valor)
        {
            var d = SomenteDigitos(valor);

            if (d.Length != 11 || d.Distinct().Count() == 1)
                return false;

            return d[9] - '0' == CalcularDigito(d, 9)
                && d[10] - '0' == CalcularDigito(d, 10);
        }

        // Devolve o CPF no formato 000.000.000-00, ou null quando vier vazio
        public static string? Normalizar(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            if (!EhValido(valor))
                throw new DomainException("CPF inválido");

            var d = SomenteDigitos(valor);
            return $"{d.Substring(0, 3)}.{d.Substring(3, 3)}.{d.Substring(6, 3)}-{d.Substring(9, 2)}";
        }

        private static int CalcularDigito(string d, int quantidade)
        {
            var soma = 0;
            for (var i = 0; i < quantidade; i++)
                soma += (d[i] - '0') * (quantidade + 1 - i);

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }
}