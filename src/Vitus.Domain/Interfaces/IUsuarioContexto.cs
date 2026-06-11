namespace Vitus.Domain.Interfaces
{
    public interface IUsuarioContexto
    {
        Guid UsuarioId { get; }
        string UsuarioNome { get; }
    }
}