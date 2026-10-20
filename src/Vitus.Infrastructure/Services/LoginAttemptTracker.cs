using System.Collections.Concurrent;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class LoginAttemptTracker : ILoginAttemptTracker
    {
        private const int MaxFalhas = 5;
        private const int LimiteEntradas = 10_000;
        private static readonly TimeSpan DuracaoBloqueio = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan JanelaFalhas = TimeSpan.FromMinutes(15);

        private sealed class Entrada
        {
            public int Falhas;
            public DateTime UltimaFalha;
            public DateTime? BloqueadoAte;
        }

        private readonly ConcurrentDictionary<string, Entrada> _entradas = new();

        public TimeSpan? TempoRestanteBloqueio(string chave)
        {
            if (!_entradas.TryGetValue(Normalizar(chave), out var entrada))
                return null;

            lock (entrada)
            {
                var agora = DateTime.UtcNow;
                return entrada.BloqueadoAte is { } ate && ate > agora ? ate - agora : null;
            }
        }

        public void RegistrarFalha(string chave)
        {
            if (_entradas.Count >= LimiteEntradas)
                RemoverExpiradas();

            var entrada = _entradas.GetOrAdd(Normalizar(chave), _ => new Entrada());

            lock (entrada)
            {
                var agora = DateTime.UtcNow;

                if (entrada.BloqueadoAte is { } ate && ate <= agora)
                {
                    entrada.Falhas = 0;
                    entrada.BloqueadoAte = null;
                }

                if (agora - entrada.UltimaFalha > JanelaFalhas)
                    entrada.Falhas = 0;

                entrada.Falhas++;
                entrada.UltimaFalha = agora;

                if (entrada.Falhas >= MaxFalhas)
                    entrada.BloqueadoAte = agora + DuracaoBloqueio;
            }
        }

        public void Limpar(string chave) => _entradas.TryRemove(Normalizar(chave), out _);

        private static string Normalizar(string chave)
        {
            var normalizada = chave.Trim().ToLowerInvariant();
            return normalizada.Length > 200 ? normalizada[..200] : normalizada;
        }

        private void RemoverExpiradas()
        {
            var limite = DateTime.UtcNow - (JanelaFalhas + DuracaoBloqueio);
            foreach (var par in _entradas)
            {
                if (par.Value.UltimaFalha < limite)
                    _entradas.TryRemove(par.Key, out _);
            }
        }
    }
}