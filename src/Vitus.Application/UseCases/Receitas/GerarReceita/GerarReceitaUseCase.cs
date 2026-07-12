using Vitus.Communication.Receita.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Receitas.GerarReceita
{
    public class GerarReceitaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IReceitaRepository _receitaRepository;
        private readonly IDocumentoService _documentoService;
        private readonly IAuditoriaService _auditoriaService;

        public GerarReceitaUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IProntuarioRepository prontuarioRepository,
            IReceitaRepository receitaRepository,
            IDocumentoService documentoService,
            IAuditoriaService auditoriaService)
        {
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _prontuarioRepository = prontuarioRepository;
            _receitaRepository = receitaRepository;
            _documentoService = documentoService;
            _auditoriaService = auditoriaService;
        }

        public async Task<(byte[] Arquivo, string NomeArquivo)> Execute(GerarReceitaRequestJson request)
        {
            var consulta = await _consultaRepository.GetById(request.ConsultaId);
            if (consulta == null)
                throw new DomainException("Consulta não encontrada");

            if (consulta.Status == StatusConsulta.Cancelada)
                throw new DomainException("Não é possível gerar receita para consulta cancelada");

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            if (paciente == null)
                throw new DomainException("Paciente não encontrado");

            var medico = await _medicoRepository.GetById(consulta.MedicoId);
            if (medico == null)
                throw new DomainException("Médico não encontrado");

            var prontuario = await _prontuarioRepository.GetByPacienteId(consulta.PacienteId);
            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            if (!Enum.TryParse<TipoReceita>(request.TipoReceita, ignoreCase: true, out var tipoReceita))
                throw new DomainException("Tipo de receita inválido. Use: Comum ou Especial");

            if (!Enum.TryParse<TipoUso>(request.TipoUso, ignoreCase: true, out var tipoUso))
                throw new DomainException("Tipo de uso inválido. Use: Oral, Interno ou Externo");

            var receita = new Receita(consulta.Id, prontuario.Id);
            foreach (var m in request.Medicamentos)
                receita.AdicionarMedicamento(m.Nome, m.Dosagem, m.Posologia, m.Quantidade);

            await _receitaRepository.Add(receita);
            await _auditoriaService.Registrar(AcaoAuditoria.EmissaoReceita, "Receita", receita.Id);

            var medicamentosDoc = request.Medicamentos
                .Select((m, idx) =>
                {
                    var tracos = new string('-', 45);
                    var linha = $"{idx + 1}) {m.Nome}{(string.IsNullOrWhiteSpace(m.Dosagem) ? "" : $" {m.Dosagem}")} {tracos} {m.Quantidade}";
                    return (linha, m.Posologia);
                })
                .ToList();

            var dataFormatada = DateTime.Now.ToString("dd/MM/yyyy");

            byte[] arquivo;
            try
            {
                arquivo = await _documentoService.GerarReceita(
                    tipoReceita,
                    tipoUso,
                    paciente.Nome,
                    paciente.Endereco,
                    medico.Nome,
                    dataFormatada,
                    medicamentosDoc);
            }
            catch (Exception ex)
            {
                throw new DomainException($"Erro ao gerar documento: {ex.GetType().Name} - {ex.Message}");
            }

            var nomeArquivo = $"Receita_{tipoReceita}_{paciente.Nome.Replace(" ", "_")}_{dataFormatada.Replace("/", "-")}.docx";

            return (arquivo, nomeArquivo);
        }
    }
}