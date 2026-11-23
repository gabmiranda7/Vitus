using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.GetUsuariosPendentes
{
    public class GetUsuariosPendentesUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IEnfermeiroRepository _enfermeiroRepository;

        public GetUsuariosPendentesUseCase(
            IUsuarioRepository usuarioRepository,
            IMedicoRepository medicoRepository,
            IEnfermeiroRepository enfermeiroRepository)
        {
            _usuarioRepository = usuarioRepository;
            _medicoRepository = medicoRepository;
            _enfermeiroRepository = enfermeiroRepository;
        }

        public async Task<IList<UsuarioPendenteResponseJson>> Execute()
        {
            var pendentes = await _usuarioRepository.GetByStatus(StatusUsuario.Pendente);
            var resultado = new List<UsuarioPendenteResponseJson>();

            foreach (var u in pendentes)
            {
                var item = new UsuarioPendenteResponseJson
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email,
                    Perfil = u.Perfil.ToString()
                };

                if (u.Perfil == PerfilUsuario.Medico)
                {
                    var medico = await _medicoRepository.GetByUsuarioId(u.Id);
                    if (medico != null)
                    {
                        item.Crm = medico.CRM;
                        item.Especialidade = medico.Especialidade;
                    }
                }
                else if (u.Perfil == PerfilUsuario.Enfermeiro)
                {
                    var enfermeiro = await _enfermeiroRepository.GetByUsuarioId(u.Id);
                    if (enfermeiro != null)
                    {
                        item.Coren = enfermeiro.COREN;
                        item.Especializacao = enfermeiro.Especializacao;
                    }
                }

                resultado.Add(item);
            }

            return resultado;
        }
    }
}