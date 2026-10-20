namespace Vitus.Domain.Interfaces
{
    public interface ILoginAttemptTracker
    {
        TimeSpan? TempoRestanteBloqueio(string chave);
        void RegistrarFalha(string chave);
        void Limpar(string chave);
    }
}