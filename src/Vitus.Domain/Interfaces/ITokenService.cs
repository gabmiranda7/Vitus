using Vitus.Domain.Entities;

namespace Vitus.Domain.Interfaces
{
    public interface ITokenService
    {
        string Generate(Usuario usuario);
    }
}