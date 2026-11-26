using System.Security.Cryptography;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.RedefinirSenhaUsuario
{
    public class RedefinirSenhaUsuarioUseCase
    {
        private const int TamanhoSenhaTemporaria = 12;

        // Sem caracteres ambíguos (0/O, 1/l/I) para facilitar o repasse da senha ao usuário
        private const string Maiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        private const string Minusculas = "abcdefghijkmnopqrstuvwxyz";
        private const string Numeros = "23456789";
        private const string Simbolos = "!@#$%&*?";

        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IAuditoriaService _auditoriaService;

        public RedefinirSenhaUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IAuditoriaService auditoriaService)
        {
            _usuarioRepository = usuarioRepository;
            _auditoriaService = auditoriaService;
        }

        public async Task<SenhaTemporariaResponseJson> Execute(Guid usuarioId)
        {
            var usuario = await _usuarioRepository.GetById(usuarioId);

            if (usuario == null)
                throw new DomainException("Usuário não encontrado");

            var senhaTemporaria = GerarSenhaTemporaria();
            usuario.RedefinirComSenhaTemporaria(BCrypt.Net.BCrypt.HashPassword(senhaTemporaria));

            await _usuarioRepository.Update(usuario);

            // A senha nunca é registrada na auditoria
            await _auditoriaService.Registrar(
                AcaoAuditoria.RedefinicaoSenhaPeloAdmin,
                "Usuario",
                usuario.Id,
                $"Senha temporária gerada para {usuario.Nome} ({usuario.Perfil})");

            return new SenhaTemporariaResponseJson { SenhaTemporaria = senhaTemporaria };
        }

        /// <summary>Gera uma senha forte (maiúscula, minúscula, número e símbolo) com sorteio criptográfico.</summary>
        public static string GerarSenhaTemporaria()
        {
            var todos = Maiusculas + Minusculas + Numeros + Simbolos;

            var caracteres = new List<char>
            {
                Sortear(Maiusculas),
                Sortear(Minusculas),
                Sortear(Numeros),
                Sortear(Simbolos)
            };

            while (caracteres.Count < TamanhoSenhaTemporaria)
                caracteres.Add(Sortear(todos));

            // Embaralha para que os quatro primeiros não fiquem sempre na mesma ordem
            for (var i = caracteres.Count - 1; i > 0; i--)
            {
                var j = RandomNumberGenerator.GetInt32(i + 1);
                (caracteres[i], caracteres[j]) = (caracteres[j], caracteres[i]);
            }

            return new string(caracteres.ToArray());
        }

        private static char Sortear(string origem) =>
            origem[RandomNumberGenerator.GetInt32(origem.Length)];
    }
}