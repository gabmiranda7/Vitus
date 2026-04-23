using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface IUsuarioRepository
    {
        Task Add(Usuario usuario);
        Task<Usuario?> GetByEmail(string email);
    }
}