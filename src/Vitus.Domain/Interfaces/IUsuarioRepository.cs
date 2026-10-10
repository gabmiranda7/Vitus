using Vitus.Domain.Entities;
using Vitus.Domain.Enums;

namespace Vitus.Domain.Interfaces
{
    public interface IUsuarioRepository
    {
        Task Add(Usuario usuario);
        Task Update(Usuario usuario);
        Task<Usuario?> GetByEmail(string email);
        Task<Usuario?> GetById(Guid id);
        Task<IList<Usuario>> GetByStatus(StatusUsuario status);
    }
}