using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class UsuarioContexto : IUsuarioContexto
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UsuarioContexto(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UsuarioId
        {
            get
            {
                var claim = _httpContextAccessor.HttpContext?.User
                    .FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
            }
        }

        public string UsuarioNome
        {
            get
            {
                return _httpContextAccessor.HttpContext?.User
                    .FindFirst(ClaimTypes.Name)?.Value ?? "Desconhecido";
            }
        }
    }
}