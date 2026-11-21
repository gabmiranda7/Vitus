using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.DeletePaciente
{
    public class DeletePacienteUseCase
    {
        private readonly IPacienteRepository _repository;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IExameRepository _exameRepository;
        private readonly IArquivoService _arquivoService;

        public DeletePacienteUseCase(
            IPacienteRepository repository,
            IAuditoriaService auditoriaService,
            IExameRepository exameRepository,
            IArquivoService arquivoService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
            _exameRepository = exameRepository;
            _arquivoService = arquivoService;
        }

        public async Task Execute(Guid id)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            var caminhos = new List<string>();

            if (paciente.Prontuario != null)
            {
                var exames = await _exameRepository.GetByProntuarioId(paciente.Prontuario.Id);

                caminhos = exames
                    .SelectMany(e => e.Arquivos
                        .Select(a => a.CaminhoArquivo)
                        .Append(e.CaminhoArquivo ?? string.Empty))
                    .Where(c => !string.IsNullOrWhiteSpace(c))
                    .Distinct()
                    .ToList();
            }

            await _auditoriaService.Registrar(
                AcaoAuditoria.ExclusaoPaciente,
                "Paciente",
                paciente.Id,
                $"Paciente '{paciente.Nome}' excluído"
            );

            await _repository.Delete(paciente);

            foreach (var caminho in caminhos)
            {
                try
                {
                    _arquivoService.Deletar(caminho);
                }
                catch (IOException) { }
                catch (UnauthorizedAccessException) { }
            }
        }
    }
}