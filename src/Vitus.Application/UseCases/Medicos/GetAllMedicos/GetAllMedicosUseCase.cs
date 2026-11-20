using Vitus.Communication.Medico.Responses;
using Vitus.Domain.Enums;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Medicos.GetAllMedicos
{
    public class GetAllMedicosUseCase
    {
        private readonly IMedicoRepository _repository;
        private readonly IUsuarioRepository _usuarioRepository;

        public GetAllMedicosUseCase(IMedicoRepository repository, IUsuarioRepository usuarioRepository)
        {
            _repository = repository;
            _usuarioRepository = usuarioRepository;
        }

        public async Task<List<MedicoResponseJson>> Execute()
        {
            var medicos = await _repository.GetAll();
            var aprovados = await _usuarioRepository.GetByStatus(StatusUsuario.Aprovado);
            var idsAprovados = aprovados.Select(u => u.Id).ToHashSet();

            return medicos
                .Where(m => idsAprovados.Contains(m.UsuarioId))
                .Select(m => new MedicoResponseJson
                {
                    Id = m.Id,
                    Nome = m.Nome,
                    Especialidade = m.Especialidade,
                    CRM = m.CRM
                }).ToList();
        }
    }
}