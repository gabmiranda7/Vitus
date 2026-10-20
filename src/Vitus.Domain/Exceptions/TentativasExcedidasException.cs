namespace Vitus.Domain.Exceptions
{
    public class TentativasExcedidasException : DomainException
    {
        public TimeSpan TempoRestante { get; }

        public TentativasExcedidasException(TimeSpan tempoRestante)
            : base($"Muitas tentativas de login. Tente novamente em {Math.Max(1, (int)Math.Ceiling(tempoRestante.TotalMinutes))} minuto(s).")
        {
            TempoRestante = tempoRestante;
        }
    }
}