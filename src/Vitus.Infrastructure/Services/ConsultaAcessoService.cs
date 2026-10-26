using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Infrastructure.Services
{
    public class ConsultaAcessoService : IConsultaAcessoService
    {
        private readonly IUsuarioContexto _usuarioContexto;
        private readonly IMedicoRepository _medicoRepository;

        public ConsultaAcessoService(IUsuarioContexto usuarioContexto, IMedicoRepository medicoRepository)
        {
            _usuarioContexto = usuarioContexto;
            _medicoRepository = medicoRepository;
        }

        public async Task GarantirMedicoResponsavel(Consulta consulta)
        {
            if (_usuarioContexto.Perfil != nameof(PerfilUsuario.Medico))
                throw new AcessoNegadoException("Apenas médicos podem realizar esta ação");

            await ValidarResponsavel(consulta);
        }

        public async Task GarantirResponsavelSeMedico(Consulta consulta)
        {
            if (_usuarioContexto.Perfil != nameof(PerfilUsuario.Medico))
                return;

            await ValidarResponsavel(consulta);
        }

        private async Task ValidarResponsavel(Consulta consulta)
        {
            var medico = await _medicoRepository.GetByUsuarioId(_usuarioContexto.UsuarioId);

            if (medico == null || medico.Id != consulta.MedicoId)
                throw new AcessoNegadoException("Você só pode realizar esta ação em consultas atribuídas a você");
        }
    }
}